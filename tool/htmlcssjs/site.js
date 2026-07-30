const currentPage = document.body.dataset.page || "overview";
const navItems = [
  ["index.html", "overview", "⌁", "经营总览"],
  ["operations.html", "operations", "♜", "统一营业台"],
  ["tasks.html", "tasks", "♧", "当前任务"],
  ["bills.html", "bills", "▣", "账单中心"],
  ["kitchen.html", "kitchen", "♨", "后厨出餐"],
  ["employees.html", "employees", "♙", "员工权限"],
  ["states.html", "states", "⚠", "状态矩阵"],
  ["tokens.html", "tokens", "◇", "设计系统"]
];
const shell = document.querySelector("[data-shell]");
if (shell) {
  shell.innerHTML = `
    <aside class="sidebar">
      <a class="brand" href="index.html"><span class="brand-mark">R</span><strong>RAY 运营台</strong></a>
      <div class="role-card"><strong>前台 / 收银员</strong><small>Ray 现代中餐厅 · 总店</small></div>
      <nav class="nav" aria-label="实验室页面导航">
        ${navItems.map(([href,key,icon,label]) => `<a href="${href}" class="${currentPage===key?"active":""}" ${currentPage===key?'aria-current="page"':""}><span class="nav-icon">${icon}</span><span class="nav-label">${label}</span></a>`).join("")}
      </nav>
      <div class="shift-card">本班次<br><strong>32 单 · ¥ 4,286</strong></div>
    </aside>
    <section class="main">
      <header class="topbar">
        <div class="live"><i class="live-dot"></i><span>实时任务已连接</span></div>
        <div class="topbar-actions"><a class="button motion-entry" href="tokens.html#motion">动效规范</a><button class="navy" data-store>总店⌄</button></div>
      </header>
      <div data-page-content></div>
    </section>`;
  document.querySelector("[data-page-content]").append(...document.querySelectorAll("body > template[data-content]")[0].content.cloneNode(true).childNodes);
  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `<span>Ray 运营台 · HTML 交互实验室</span><span><a href="index.html">返回首页</a> · <a href="tokens.html">设计系统</a></span>`;
  shell.querySelector(".main").append(footer);
}
document.querySelectorAll(".reveal").forEach((el, index) => el.style.setProperty("--i", String(index % 9)));
requestAnimationFrame(() => document.body.classList.add("ready"));

const toast = document.createElement("div");
toast.className = "toast";
toast.setAttribute("role", "status");
document.body.append(toast);
let toastTimer;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2800);
}
document.querySelectorAll("[data-demo]").forEach(button => button.addEventListener("click", () => showToast(button.dataset.demo || "这是本地设计演示，不会发送网络请求。")));

const motionButton = document.createElement("button");
motionButton.className = "motion-toggle";
motionButton.textContent = "动效：开";
motionButton.setAttribute("aria-pressed", "true");
motionButton.addEventListener("click", () => {
  const off = document.body.classList.toggle("motion-off");
  motionButton.textContent = `动效：${off ? "关" : "开"}`;
  motionButton.setAttribute("aria-pressed", String(!off));
});
document.body.append(motionButton);

document.querySelectorAll("[data-filter]").forEach(button => button.addEventListener("click", () => {
  button.parentElement.querySelectorAll("[data-filter]").forEach(item => item.classList.remove("active"));
  button.classList.add("active");
  const mode = button.dataset.filter;
  document.querySelectorAll("[data-bill-mode]").forEach(row => row.hidden = mode !== "all" && row.dataset.billMode !== mode);
}));
document.querySelectorAll(".option").forEach(option => option.addEventListener("click", () => {
  option.parentElement.querySelectorAll(".option").forEach(item => item.classList.remove("selected"));
  option.classList.add("selected");
  document.querySelector("[data-mode-label]")?.replaceChildren(option.dataset.label);
  document.querySelector("[data-fee]")?.replaceChildren(option.dataset.fee);
  document.querySelector("[data-total]")?.replaceChildren(option.dataset.total);
}));
document.querySelectorAll(".dish").forEach(card => card.addEventListener("click", () => {
  card.animate([{transform:"scale(.97)"},{transform:"scale(1.02)"},{transform:"none"}], {duration:420, easing:"cubic-bezier(.2,.9,.2,1.2)"});
  const cart = document.querySelector("[data-cart]");
  if (cart) {
    const row = document.createElement("div");
    row.className = "cart-row";
    row.innerHTML = `<div><strong>${card.dataset.name}</strong><br><span>标准份 · 1份</span></div><strong>¥${card.dataset.price}</strong>`;
    cart.append(row);
    const count = document.querySelector("[data-cart-count]");
    count.textContent = String(Number(count.textContent) + 1);
    count.classList.remove("bump");
    void count.offsetWidth;
    count.classList.add("bump");
  }
}));
document.querySelectorAll("[data-ticket-action]").forEach(button => button.addEventListener("click", () => {
  const ticket = button.closest(".ticket");
  ticket.animate([{transform:"translateX(0)",opacity:1},{transform:"translateX(30px)",opacity:0}], {duration:360, easing:"ease", fill:"forwards"});
  setTimeout(() => ticket.remove(), 350);
  showToast("状态已在本地演示中推进；未连接真实后端。");
}));
document.querySelectorAll("[data-flash-tasks]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll(".task").forEach((task, index) => setTimeout(() => {
    task.classList.remove("flash");
    void task.offsetWidth;
    task.classList.add("flash");
  }, index * 90));
}));
document.addEventListener("keydown", event => {
  if (event.key === "Escape") {
    document.querySelectorAll(".drawer-backdrop.open").forEach(dialog => dialog.classList.remove("open"));
    toast.classList.remove("show");
  }
});
