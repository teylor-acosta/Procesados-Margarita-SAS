const counters = document.querySelectorAll(".contador");

const observer = new IntersectionObserver((entries) => {

    entries.forEach(entry => {

        if(entry.isIntersecting){

            const el = entry.target;

            const target = +el.dataset.target;

            let count = 0;

            const speed = target / 70;

            const update = () => {

                count += speed;

                if(count < target){

                    el.innerText = Math.floor(count);

                    requestAnimationFrame(update);

                }else{

                    el.innerText = target + "+";

                }

            };

            update();

            observer.unobserve(el);

        }

    });

});

counters.forEach(counter => observer.observe(counter));

const navbar = document.querySelector(".navbar");

window.addEventListener("scroll",()=>{

    if(window.scrollY>80){

        navbar.classList.add("scrolled");

    }else{

        navbar.classList.remove("scrolled");

    }

});