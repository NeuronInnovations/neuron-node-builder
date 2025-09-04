!(function(e,t){const a="featurebase-sdk";function n(){if(!t.getElementById(a)){var e=t.createElement("script");(e.id=a),(e.src="https://do.featurebase.app/js/sdk.js"),t.getElementsByTagName("script")[0].parentNode.insertBefore(e,t.getElementsByTagName("script")[0])}}"function"!=typeof e.Featurebase&&(e.Featurebase=function(){(e.Featurebase.q=e.Featurebase.q||[]).push(arguments)}),"complete"===t.readyState||"interactive"===t.readyState?n():t.addEventListener("DOMContentLoaded",n)})(window,document);
Featurebase("initialize_feedback_widget", {
  organization: "Neuron", // Replace this with your organization name
  theme: "dark",
  placement: "left",
  email: "youruser@example.com",
  defaultBoard: "yourboardname",
  locale: "en",
  metadata: null
});