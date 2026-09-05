type FilePickerProps = {
  onFileSelect: (file: File | null) => void;
};

export function FilePicker({ onFileSelect }: FilePickerProps) {
  return (
    <label className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-5 py-8 text-center shadow-sm transition hover:border-brand-accent/80 hover:bg-neutral-50">
      <span className="text-sm font-semibold text-neutral-950">Choose video</span>
      <span className="mt-1 max-w-sm text-sm leading-6 text-neutral-600">
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
      <span className="mt-5 rounded-full border border-neutral-300 bg-white px-4 py-2 text-xs font-semibold text-neutral-950 transition group-hover:border-brand-accent/80 group-hover:text-brand-accent">
        Browse file
      </span>
    </label>
  );
}
