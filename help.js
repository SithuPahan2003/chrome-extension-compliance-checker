// help.js
document.addEventListener("DOMContentLoaded", () => {
    const collapsibles = document.querySelectorAll(".collapsible");
    console.log("Help.js loaded");
  
    collapsibles.forEach(button => {
      button.addEventListener("click", () => {
        console.log("Clicked:", button.innerText);
        const content = button.nextElementSibling;
  
        // Toggle the content
        if (content.style.display === "block") {
          content.style.display = "none";
        } else {
          content.style.display = "block";
        }
  
        // Optional: toggle 'open' class for smooth animation if desired
        content.classList.toggle("open");
      });
    });
  });
  