window.SahaContact = {
  endpoint: "/api/contact",
  async submit(payload) {
    const res = await fetch(this.endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload),
      credentials: "same-origin"
    });
    let data = {};
    try {
      data = await res.json();
    } catch (_) {}
    return { status: res.status, data };
  }
};