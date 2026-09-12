package handlers

import (
	"database/sql"
	"encoding/json"
	"errors"
	"go-api/internal/middleware"
	"net/http"
	"strings"
	"time"
)

type LinkHandler struct {
	db *sql.DB
}

func NewLinkHandler(db *sql.DB) (*LinkHandler, error) {
	if db == nil {
		return nil, errors.New("db is required")
	}
	return &LinkHandler{db: db}, nil
}

type CreateLinkRequest struct {
	InviteCode string `json:"inviteCode"`
}

type LinkedCreatorResponse struct {
	ID            string    `json:"id"`
	Name          *string   `json:"name"`
	Email         string    `json:"email"`
	CreatedAt     time.Time `json:"createdAt"`
	AlreadyLinked bool      `json:"alreadyLinked"`
}

func (h *LinkHandler) CreateLink(w http.ResponseWriter, r *http.Request) {
	editorID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var req CreateLinkRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invalid request body"})
		return
	}

	code := strings.ToUpper(strings.TrimSpace(req.InviteCode))
	if code == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "inviteCode is required"})
		return
	}

	//1. find creator by id

	var creatorID, creatorEmail, creatorRole string
	var creatorName sql.NullString

	err := h.db.QueryRowContext(r.Context(),
		`
	SELECT "id", "name", "email", "role" FROM "User" WHERE UPPER("inviteCode") = $1`,
		code,
	).Scan(&creatorID, &creatorName, &creatorEmail, &creatorRole)

	if errors.Is(err, sql.ErrNoRows) {
		writeJSON(w, http.StatusNotFound, map[string]string{"error": "Invalid invite code"})
		return
	}

	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to lookup invite code"})
		return
	}

	if creatorRole != "CREATOR" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "Invite code is not for a creator"})
		return
	}

	if creatorID == editorID {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "You cannot link to yourself"})
		return
	}

	// 2. Requester must be an editor (or admin), not another creator
	var requesterRole string
	if err := h.db.QueryRowContext(r.Context(),
		`SELECT "role" FROM "User" WHERE "id" = $1`, editorID,
	).Scan(&requesterRole); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}
	if requesterRole == "CREATOR" {
		writeJSON(w, http.StatusForbidden, map[string]string{"error": "Creators cannot link as editors"})
		return
	}

	// 3. Insert link, idempotent
	var linkID string
	var createdAt time.Time

	err = h.db.QueryRowContext(r.Context(),
		`
	INSERT INTO "CreatorEditorLink" ("creatorId","editorId")
	VALUES ($1,$2)
	ON CONFLICT ("creatorId", "editorId") DO NOTHING
	RETURNING "id", "createdAt"
	`,
		creatorID,
		editorID,
	).Scan(&linkID,&createdAt)

	alreadyLinked := false
	if errors.Is(err, sql.ErrNoRows) {
		// Conflict path: link already exists, fetch its timestamp
		alreadyLinked = true
		if err := h.db.QueryRowContext(r.Context(),
			`SELECT "createdAt" FROM "CreatorEditorLink" WHERE "creatorId" = $1 AND "editorId" = $2`,
			creatorID, editorID,
		).Scan(&createdAt); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create link"})
			return
		}
	} else if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to create link"})
		return
	}
	var name *string
	if creatorName.Valid {
		name = &creatorName.String
	}

	status := http.StatusCreated
	if alreadyLinked {
		status = http.StatusOK
	}
	writeJSON(w, status, LinkedCreatorResponse{
		ID: creatorID, Name: name, Email: creatorEmail,
		CreatedAt: createdAt, AlreadyLinked: alreadyLinked,
	})

}

type LinkedPersonResponse struct {
	ID       string    `json:"id"`
	Name     *string   `json:"name"`
	Email    string    `json:"email"`
	LinkedAt time.Time `json:"linkedAt"`
}

type GetLinksResponse struct {
	Creators []LinkedPersonResponse `json:"creators,omitempty"`
	Editors  []LinkedPersonResponse `json:"editors,omitempty"`
}

// GET /links — role-aware:
// EDITOR → linked creators (for upload dropdown)
// CREATOR → linked editors (for team list)

func (h *LinkHandler) GetLinks(w http.ResponseWriter, r *http.Request) {
	userID, ok := middleware.UserIDFromContext(r.Context())
	if !ok {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	var role string
	if err := h.db.QueryRowContext(r.Context(),
		`SELECT "role" FROM "User" WHERE "id" = $1`, userID,
	).Scan(&role); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "Unauthorized"})
		return
	}

	if role == "CREATOR" {
		rows, err := h.db.QueryContext(r.Context(),
			`SELECT u."id", u."name", u."email", l."createdAt"
			 FROM "CreatorEditorLink" l
			 JOIN "User" u ON u."id" = l."editorId"
			 WHERE l."creatorId" = $1
			 ORDER BY l."createdAt" DESC`, userID)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch links"})
			return
		}
		defer rows.Close()

		editors := []LinkedPersonResponse{}
		for rows.Next() {
			var p LinkedPersonResponse
			var name sql.NullString

			if err := rows.Scan(&p.ID, &name, &p.Email, &p.LinkedAt); err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read links"})
				return
			}
			if name.Valid {
				p.Name = &name.String
			}
			editors = append(editors, p)
		}
		if err := rows.Err(); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{
				"error": "Failed to read links",
			})
			return
		}
		writeJSON(w, http.StatusOK, GetLinksResponse{Editors: editors})
		return
	}

	// EDITOR + ADMIN → linked creators
	rows, err := h.db.QueryContext(r.Context(),
		`SELECT u."id", u."name", u."email", l."createdAt"
 FROM "CreatorEditorLink" l
 JOIN "User" u ON u."id" = l."creatorId"
 WHERE l."editorId" = $1
 ORDER BY l."createdAt" DESC`, userID)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to fetch links"})
		return
	}
	defer rows.Close()

	creators := []LinkedPersonResponse{}

	for rows.Next() {
		var p LinkedPersonResponse
		var name sql.NullString
		if err := rows.Scan(&p.ID, &name, &p.Email, &p.LinkedAt); err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "Failed to read links"})
			return
		}
		if name.Valid {
			p.Name = &name.String
		}
		creators = append(creators, p)
	}
	if err := rows.Err(); err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{
			"error": "Failed to read links",
		})
		return
	}
	writeJSON(w, http.StatusOK, GetLinksResponse{Creators: creators})

}
