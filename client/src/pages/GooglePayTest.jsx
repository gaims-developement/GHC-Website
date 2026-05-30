import GooglePayButton from "../components/GooglePayButton";

function GooglePayTest() {
  return (
    <main style={{ minHeight: "100vh", padding: "48px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <section style={{ maxWidth: "420px", margin: "0 auto" }}>
        <h1>Google Pay Test</h1>
        <p>Test payment amount: USD 10.00</p>
        <GooglePayButton amount={1000} currency="usd" label="GHC Test Payment" />
      </section>
    </main>
  );
}

export default GooglePayTest;
