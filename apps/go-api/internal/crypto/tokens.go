package tokencrypto

import (
	"crypto/aes"
	"crypto/cipher"
	"crypto/rand"
	"encoding/base64"
	"fmt"
	"io"
)

type TokenCipher struct {
	aead cipher.AEAD
}

func NewTokenCipher(base64Key string) (*TokenCipher, error) {
	key, err := base64.StdEncoding.DecodeString(base64Key)
	if err != nil {
		return nil, fmt.Errorf("decode token encryption key: %w", err)
	}

	if len(key) != 32 {
		return nil, fmt.Errorf("token encryption key must decode to 32 bytes")
	}

	block, err := aes.NewCipher(key)
	if err != nil {
		return nil, fmt.Errorf("create aes cipher: %w", err)
	}

	aead, err := cipher.NewGCM(block)
	if err != nil {
		return nil, fmt.Errorf("create gcm cipher: %w", err)
	}

	return &TokenCipher{aead: aead}, nil
}

func (c *TokenCipher) Encrypt(plain string) (string, error) {
	nonce := make([]byte, c.aead.NonceSize())
	if _, err := io.ReadFull(rand.Reader, nonce); err != nil {
		return "", fmt.Errorf("create nonce: %w", err)
	}

	ciphertext := c.aead.Seal(nil, nonce, []byte(plain), nil)
	out := append(nonce, ciphertext...)

	return base64.StdEncoding.EncodeToString(out), nil
}

func (c *TokenCipher) Decrypt(encrypted string) (string, error) {
	data, err := base64.StdEncoding.DecodeString(encrypted)
	if err != nil {
		return "", fmt.Errorf("decode encrypted token: %w", err)
	}

	nonceSize := c.aead.NonceSize()
	if len(data) < nonceSize {
		return "", fmt.Errorf("encrypted token is too short")
	}

	nonce := data[:nonceSize]
	ciphertext := data[nonceSize:]

	plain, err := c.aead.Open(nil, nonce, ciphertext, nil)
	if err != nil {
		return "", fmt.Errorf("decrypt token: %w", err)
	}

	return string(plain), nil
}