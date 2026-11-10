import { Link } from "react-router-dom";

function PlaceholderPage({ title, eyebrow }) {
  return (
    <section className="placeholder-page page-enter">
      <span className="eyebrow">{eyebrow}</span>
      <h1>{title}<em>.</em></h1>
      <p>This space is ready for the next Sweety experience.</p>
      <Link className="button button-dark" to="/">Back to preview <span>→</span></Link>
    </section>
  );
}

export default PlaceholderPage;
