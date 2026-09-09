type FilePickerProps = {
  onFileSelect: (file: File | null) => void;
};

export function FilePicker({ onFileSelect }: FilePickerProps) {
  return (
    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-background-300 bg-background-50 px-5 py-8 text-center shadow-sm transition hover:border-primary-700/80 hover:bg-background-100">
      <span className="text-sm font-semibold text-text-950">Choose video</span>
      <span className="mt-1 max-w-sm text-sm leading-6 text-text-600">
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
      <span className="mt-5 rounded-full border border-background-300 bg-white px-4 py-2 text-xs font-semibold text-text-950 transition group-hover:border-primary-700/80 group-hover:text-primary-700">
        Browse file
      </span>
    </label>
  );
}
