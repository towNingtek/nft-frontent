const coll = document.querySelectorAll(".faq__collapsable");
const menuElement = document.querySelector(".header__menu");
const menuList = document.querySelector(".header__list");
const buttonScrollTop = document.querySelector(".buttonTop");

for (let i = 0; i < coll.length; i++) {
  coll[i].addEventListener("click", () => {
    coll[i].classList.toggle("active");
    const content = coll[i].nextElementSibling;
    if (content.style.maxHeight) {
      content.style.maxHeight = null;
    } else {
      content.style.maxHeight = content.scrollHeight + "px";
    }
  });
}

menuElement.addEventListener("click", function () {
  menuElement.classList.toggle("toggle");
  menuList.classList.toggle("toggle");
});

window.addEventListener("scroll", function () {
  const scroll = document.querySelector(".buttonTop");
  scroll.classList.toggle("active", window.scrollY > 500);
  /*console.log(scroll);*/
});

buttonScrollTop.addEventListener("click", function scrollTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth",
  });
});
