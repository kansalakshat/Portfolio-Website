let home=document.querySelector("#home")
let skill=document.querySelector("#skill")
let about=document.querySelector("#about")
let contact=document.querySelector("#contact")
let glideImg = document.querySelector("#trans")
let homepage=document.querySelector("#homepage")
let skillpage=document.querySelector("#skillpage")
let aboutpage=document.querySelector("#aboutpage")
let contactpage=document.querySelector("#contactpage")
home.classList.add("active")
function homepagehide(){
    homepage.classList.add("inactive")
}
function homepageshow(){
    homepage.classList.remove("inactive")
}
function skillpagehide(){
    skillpage.classList.add("inactive")
}
function skillpageshow(){
    skillpage.classList.remove("inactive")
}
function aboutpagehide(){
    aboutpage.classList.add("inactive")
}
function aboutpageshow(){
    aboutpage.classList.remove("inactive")

}
function contactpagehide(){
    contactpage.classList.add("inactive")
}
function contactpageshow(){
    contactpage.classList.remove("inactive")
}
skillpagehide()
aboutpagehide()
contactpagehide()
home.onclick=function(){    
    home.classList.add("active")
    skill.classList.remove("active")
    about.classList.remove("active")
    contact.classList.remove("active")
    homepage.classList.remove("inactive")
    skillpage.classList.add("inactive")
    aboutpage.classList.add("inactive")
    contactpage.classList.add("inactive")
    glideImg.style.transition = "none"
    glideImg.style.display = "block"
    glideImg.style.left = "-600px"

    setTimeout(function () {
        glideImg.style.transition = "left 1s ease"
        glideImg.style.left = "600px"
    }, 50)

    setTimeout(function () {
        glideImg.style.display = "none"
    }, 1050)
}
skill.onclick=function(){
    skill.classList.add("active")
    home.classList.remove("active")
    about.classList.remove("active")
    contact.classList.remove("active")
    homepage.classList.add("inactive")
    skillpage.classList.remove("inactive")
    aboutpage.classList.add("inactive")
    contactpage.classList.add("inactive")
    glideImg.style.transition = "none"
    glideImg.style.display = "block"
    glideImg.style.left = "-600px"

    setTimeout(function () {
        glideImg.style.transition = "left 1s ease"
        glideImg.style.left = "600px"
    }, 50)

    setTimeout(function () {
        glideImg.style.display = "none"
    }, 1050)
}
about.onclick=function(){
    about.classList.add("active")
    home.classList.remove("active")
    skill.classList.remove("active")
    contact.classList.remove("active")
    homepage.classList.add("inactive")
    skillpage.classList.add("inactive")
    aboutpage.classList.remove("inactive")
    contactpage.classList.add("inactive")
    glideImg.style.transition = "none"
    glideImg.style.display = "block"
    glideImg.style.left = "-600px"

    setTimeout(function () {
        glideImg.style.transition = "left 1s ease"
        glideImg.style.left = "600px"
    }, 50)

    setTimeout(function () {
        glideImg.style.display = "none"
    }, 1050)
}
contact.onclick=function(){
    contact.classList.add("active")
    home.classList.remove("active")
    skill.classList.remove("active")
    about.classList.remove("active")
    contactpage.classList.remove("inactive")
    homepage.classList.add("inactive")
    skillpage.classList.add("inactive")
    aboutpage.classList.add("inactive")
    glideImg.style.transition = "none"
    glideImg.style.display = "block"
    glideImg.style.left = "-600px"

    setTimeout(function () {
        glideImg.style.transition = "left 1s ease"
        glideImg.style.left = "600px"
    }, 50)

    setTimeout(function () {
        glideImg.style.display = "none"
    }, 1050)
}