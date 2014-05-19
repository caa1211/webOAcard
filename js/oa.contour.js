

OA.Contour = function (userSetting) {
   //private
   var _def = {
      isHole: false,
      point2Ds: []
   };
   var contour = this;
   var point2Ds = [];
   var _setting = $.extend({}, _def, userSetting);
    
   var init = function(){
   	   return contour;
   };

   //public
   this.test = function(){
   
   }
   return init();
  
};

