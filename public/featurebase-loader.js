
// Load Featurebase SDK dynamically
(function() {
  var script = document.createElement("script");
  script.src = "https://do.featurebase.app/js/sdk.js";
  script.async = true;
  script.onload = function() {
    // Boot Featurebase after SDK loads
    Featurebase("boot", {
      appId: "68ac623bb50949d095155ee3",         // required
      email: "user@example.com",         // optional
      userId: "12345",                   // optional
      createdAt: "2025-05-06T12:00:00Z", // optional
      theme: "light",                    // "light" or "dark"
      language: "en"                     // short code
    });
  };
  document.head.appendChild(script);
})();

