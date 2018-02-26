webOAcard   
=========

<img src="http://caa1211.github.io/webOAcard/preview.png?1" style="border: solid 1px gray;">

Preview:
![Preview](preview.gif)

Demo:
- http://caa1211.github.io/webOAcard/?m=castle

Slide: 
- http://slides.com/caa1211/web3d

Author:
- caa1211@gmail.com   
- https://www.facebook.com/caa1211
- https://tw.linkedin.com/in/yu-chih-chang-03551963
  

Libraries used: 
  - Three.JS: https://github.com/mrdoob/three.js/
  - JS Clipper: http://sourceforge.net/projects/jsclipper/
  - jQuery: https://github.com/jquery/jquery
  - dat-GUI: https://code.google.com/p/dat-gui/
  - typeface.js: http://typeface.neocracy.org/fonts.html
  - Font Awesome: https://github.com/FortAwesome/Font-Awesome

Youtube:
  - https://www.youtube.com/watch?v=TKUqK5zyhHU
  - https://www.youtube.com/watch?v=NJpCSPWXeTE
      
Mouse Operations:

- Edit mode (init state / edit grid open)
      - left key : add points on edit grid to create a contour
      - right key : switch to Display mode
      - scroll : change depth of edit grid
      
- Contour editing
      - left key : add points or close contour (connect to the start point or press ctrl key )
      - right key : undo the last point
      
- Contour closed (can use contour functions in GUI)
      - left key : use contour to create a Face/Pull/Hole (select from GUI)
      - right key : drag to move the contour
      - scroll : change the depth of edit grid
      
- Display mode (close edit grid)
      - left key : move the camera
      - right key : switch to Edit mode (open edit grid)
      - scroll : change the card angle

Honors & Awards:

- [Google Chrome Experiment 1000!] (http://1000.chromeexperiments.com/#/experiment/3d-pop-up-card)
- [Inspiring WebGL #10 2015 by Goo Create Technologies!](http://goocreate.com/blog/1007/inspiring-webgl-10-pop-up-card-builder)
- [圧倒的な3D表現にWebの未来を感じるWebGLを使ったサイト・デモ20選!] (http://liginc.co.jp/web/tool/browser/95118)

======================================================================
滑鼠操作說明：

- 編輯模式 (初始模式/編輯格開啟)：
  - 左鍵　圈選輪廓
  - 右鍵　切換至展示模式
  - 滾輪　移動編輯格深度

- 輪廓編輯時：
  - 左鍵　點選輪廓或完成輪廓 (連接起點或按ctrl鍵)
  - 右鍵　輪廓回上一步

- 輪廓完成時 (可使用GUI中contour功能)
  - 左鍵　建立Face/Pull/Hole (由GUI選擇)
  - 右鍵　拖拉移動輪廓
  - 滾輪　移動編輯格深度

- 展示模式 (編輯格關閉)
  - 左鍵　拖拉移動攝影機
  - 右鍵　進入編輯模式 (開啟編輯格)
  - 滾輪　改變卡片角度

======================================================================
TODO:
  - Allow two points faces for adding hface
  - Detect self intersect path
