type UploadSummaryProps = {
  file: File;
};

export function UploadSummary({ file }: UploadSummaryProps) {
  return (
    <div>
      <p>{file.name}</p>
      <p>{formatBytes(file.size)}</p>
      <p>{file.type}</p>
    </div>
  );
}

function formatBytes(bytes: number) {
  const units = ["B", "KB", "MB", "GB", "TB"];

  if (bytes === 0) {
    return "0 B";
  }

  const index = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  );

  const value = bytes / 1024 ** index;

  return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}