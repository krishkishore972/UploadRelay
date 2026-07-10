type FilePickerProps = {
  onFileSelect: (file: File | null) => void;
};

export function FilePicker({ onFileSelect }: FilePickerProps) {
  return (
    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-background-300 bg-background-50/70 px-5 py-8 text-center transition hover:border-accent-700/80 hover:bg-background-100">
      <span className="text-sm font-medium text-text-950">Choose video</span>
      <span className="mt-1 max-w-sm text-sm leading-6 text-text-800">
        Select the final edited video. Large files will be uploaded in multipart
        chunks.
      </span>
      <input
        className="sr-only"
        type="file"
        accept="video/*"
        onChange={(event) => {
          onFileSelect(event.target.files?.[0] ?? null);
        }}
      />
      <span className="mt-5 rounded-md border border-background-300 bg-background-100 px-3 py-2 text-sm font-medium text-text-950 transition group-hover:border-accent-700/80 group-hover:text-accent-900">
        Browse file
      </span>
    </label>
  );
}
