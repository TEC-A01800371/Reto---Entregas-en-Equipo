// Piezas visuales base, tomadas del diseño del equipo (front_SSHIPTTC/src/components/ui.tsx)

export function Panel({ titulo, children, className = "", ...resto }) {
  return (
    <div className={`panel ${className}`.trim()} {...resto}>
      {titulo ? <div className="panel-title">{titulo}</div> : null}
      {children}
    </div>
  );
}

export function Callout({ children, tono = "info", className = "", ...resto }) {
  return (
    <div className={`callout ${tono === "info" ? "" : tono} ${className}`.replace(/\s+/g, " ").trim()} {...resto}>
      {children}
    </div>
  );
}

export function Badge({ children, tono = "flat" }) {
  return <span className={`badge ${tono}`}>{children}</span>;
}

export function SeccionCabeza({ kicker, titulo, lede }) {
  return (
    <header className="sec-head">
      <span className="kicker">{kicker}</span>
      <h2>{titulo}</h2>
      {lede ? <p className="lede">{lede}</p> : null}
    </header>
  );
}
