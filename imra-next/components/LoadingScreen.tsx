type Props = {
  message?: string;
  /** Override min-height (CSS value). Defaults to a comfortable hero-sized area. */
  minHeight?: string;
};

export default function LoadingScreen({
  message = 'Chargement…',
  minHeight = '70vh',
}: Props) {
  return (
    <div className="loading-screen" style={{ minHeight }}>
      <div className="loading-content">
        <div className="spinner" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div className="msg">{message}</div>
      </div>
    </div>
  );
}
