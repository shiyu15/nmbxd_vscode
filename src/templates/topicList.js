const vscode = acquireVsCodeApi();

const vsPostMessage = (command, messages) => {
  vscode.postMessage({
    command: command,
    ...(messages || {})
  });
};


//点击图片后切换大图和小图显示
const images = document.querySelectorAll('img');
images.forEach((image, index) => {
    image.addEventListener('click', function() {
        // 动态切换图片的src属性
        if(this.src.includes("thumb")){
            this.src = this.src.replace("thumb/", "image/");
        }else{
            this.src = this.src.replace("image/", "thumb/");
        }
    });
});