
document.addEventListener('DOMContentLoaded',function(){

    var bt_mn = document.getElementById("button-menu");
    bt_mn.addEventListener("click",()=>{
      
    
    
    var button_menu = document.getElementById("icon-m");
    
    
    var menu_bar = document.getElementById("menu-bar");
    var styleFinder = getComputedStyle(menu_bar);
    let spliter = styleFinder.top.split(".");
    let toper = parseInt(spliter);
    if(toper <= 0){
      menu_bar.style.top = "18vh";
      menu_bar.style.zIndex = "999";
       menu_bar.style.opacity = "1";
       button_menu.style.transform = "rotate(90deg)";
      
    }else{
      menu_bar.style.top = "-80vh";
      menu_bar.style.zIndex = "0";
      menu_bar.style.opacity = "0.1";
      button_menu.style.transform = "rotate(180deg)";
      
    }
    
    })



    let lastScrollTop = 0;
    const navbar = document.getElementById('navbar-main');
    const navbar2 = document.getElementById('menu-bar');
    
    // Function to check if the device is a desktop or laptop
    const isDesktop = () => {
      // Check if the screen width is greater than a typical mobile device width (e.g., 768px)
      return window.innerWidth > 768;
    };
    
    // Only attach scroll event listener if the device is a desktop or laptop
    if (isDesktop()) {
      window.addEventListener('scroll', function() {
        const currentScrollTop = window.pageYOffset || document.documentElement.scrollTop;
        if (currentScrollTop > lastScrollTop) {
          // Scrolling down
          navbar.style.top = '-140px'; // Adjust based on your navbar height
          navbar2.style.display = 'none'; // Adjust based on your navbar height
        } else {
          // Scrolling up
          navbar.style.top = '0';
          navbar2.style.display = 'flex';
        }
        lastScrollTop = currentScrollTop;
      });
    }
    
    
    
    
    
      });
    
    