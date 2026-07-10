type FilePickerProps = {
  onFileSelect: (file: File | null) => void;
};

export function FilePicker({ onFileSelect }: FilePickerProps) {
  return (
    <input
      type="file"
      accept="video/*"
      onChange={(event) => {
        onFileSelect(event.target.files?.[0] ?? null);
      }}
    />
  );
}