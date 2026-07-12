export default function Avatar({ name, avatarUrl, className, id }) {
  const initial = (name || '').trim().charAt(0).toUpperCase() || '?';
  return (
    <div className={className} id={id}>
      {avatarUrl ? <img src={avatarUrl} alt={name} /> : initial}
    </div>
  );
}
