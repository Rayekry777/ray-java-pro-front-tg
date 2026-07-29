const buttons = document.querySelectorAll(".state-button");
const content = document.querySelector("[data-content]");
const loading = document.querySelector(".loading-state");
const empty = document.querySelector(".empty-state");
const error = document.querySelector(".error-state");
const passPanel = document.querySelector(".pass-panel");

function setState(state) {
  buttons.forEach((button) => {
    const active = button.dataset.state === state;
    button.classList.toggle("active", active);
    button.setAttribute("aria-pressed", String(active));
  });

  content.hidden = ["loading", "empty", "error"].includes(state);
  loading.hidden = state !== "loading";
  empty.hidden = state !== "empty";
  error.hidden = state !== "error";
  passPanel.classList.toggle("long-copy", state === "long");
}

buttons.forEach((button) => button.addEventListener("click", () => setState(button.dataset.state)));

document.querySelector(".switch").addEventListener("click", (event) => {
  const control = event.currentTarget;
  const isOn = control.getAttribute("aria-checked") === "true";
  control.setAttribute("aria-checked", String(!isOn));
  control.classList.toggle("on", !isOn);
});

setState("success");
