const vscode = acquireVsCodeApi();

const vsPostMessage = (command, messages) => {
  vscode.postMessage({
    command: command,
    ...(messages || {})
  });
};


//点击图片后切换大图和小图显示
const images = document.querySelectorAll('.img-content');
images.forEach((image, index) => {
    image.addEventListener('click', function() {
        const img = this.querySelector('img');
        if (!img) return;

        // 切换容器的类名
        this.classList.toggle('expanded');
        
        // 动态切换图片的src属性
        if (img.src.includes("thumb")) {
            img.src = img.src.replace("thumb/", "image/");
        } else {
            img.src = img.src.replace("image/", "thumb/");
        }
    });
});


// 初始化和页面更新时都需要处理引用
document.addEventListener('DOMContentLoaded', () => {
  processQuoteLinks();
});

// 添加变量来跟踪当前激活的链接和定时器
let activeLink = null;
let tooltipTimeout = null;
let checkInterval = null; // 添加检查间隔变量

function processQuoteLinks() {
  const contentElements = document.querySelectorAll('.word-content');

  contentElements.forEach(element => {
      const pattern = /<font color="#789922">&gt;&gt;No\.(\d+)<\/font>/g;
      let html = element.innerHTML;
      html = html.replace(pattern, (match, id) => {
          return `<span class="quote-link" data-id="${id}">&gt;&gt;No.${id}</span>`;
      });
      element.innerHTML = html;

      const links = element.getElementsByClassName('quote-link');
      Array.from(links).forEach(link => {
          const newLink = link.cloneNode(true);
          link.parentNode.replaceChild(newLink, link);

          newLink.onmouseover = (event) => {
              // 清除之前的定时器
              if (tooltipTimeout) {
                  clearTimeout(tooltipTimeout);
                  tooltipTimeout = null;
              }
              
              // 清除之前的检查间隔
              if (checkInterval) {
                  clearInterval(checkInterval);
              }
              
              // 如果有其他激活的链接，先重置它
              if (activeLink && activeLink !== newLink) {
                  activeLink.style.color = "#789922";
                  hideTooltip();
              }
              
              activeLink = newLink;
              const rect = event.target.getBoundingClientRect();
              vsPostMessage('requestTooltip', {
                  type: 'topic',
                  id: newLink.dataset.id,
                  x: rect.left,
                  y: rect.bottom
              });
              
              newLink.style.cursor = "pointer";
              newLink.style.color = "#FF0000";

              // 开始持续检查鼠标位置
              checkInterval = setInterval(() => {
                  const currentRect = newLink.getBoundingClientRect();
                  const currentMouseX = window.event.clientX;
                  const currentMouseY = window.event.clientY;
                  const tooltip = document.getElementById('tooltip');
                  const tooltipRect = tooltip.getBoundingClientRect();

                  // 检查鼠标是否在链接或tooltip区域内
                  const inLinkArea = (
                      currentMouseX >= currentRect.left && 
                      currentMouseX <= currentRect.right && 
                      currentMouseY >= currentRect.top && 
                      currentMouseY <= currentRect.bottom
                  );

                  const inTooltipArea = (
                      currentMouseX >= tooltipRect.left && 
                      currentMouseX <= tooltipRect.right && 
                      currentMouseY >= tooltipRect.top && 
                      currentMouseY <= tooltipRect.bottom
                  );

                  // 如果鼠标不在链接区域也不在tooltip区域内，隐藏tooltip
                  if (!inLinkArea && !inTooltipArea) {
                      hideTooltip();
                      newLink.style.color = "#789922";
                      activeLink = null;
                      clearInterval(checkInterval);
                      checkInterval = null;
                  }
              }, 100); // 每100ms检查一次
          };

          newLink.onmouseout = (event) => {
              // 使用短暂的延迟来处理鼠标移动到tooltip的情况
              tooltipTimeout = setTimeout(() => {
                  const tooltip = document.getElementById('tooltip');
                  const tooltipRect = tooltip.getBoundingClientRect();
                  const mouseX = event.clientX;
                  const mouseY = event.clientY;

                  // 如果鼠标不在tooltip区域内，则隐藏
                  if (mouseX < tooltipRect.left || mouseX > tooltipRect.right || 
                      mouseY < tooltipRect.top || mouseY > tooltipRect.bottom) {
                      hideTooltip();
                      newLink.style.color = "#789922";
                      activeLink = null;
                      if (checkInterval) {
                          clearInterval(checkInterval);
                          checkInterval = null;
                      }
                  }
              }, 50);
          };
      });
  });
}

// 监听消息
window.addEventListener('message', event => {
  const message = event.data;
  switch (message.command) {
      case 'showTooltip':
          showTooltip(message.x, message.y, message.content);
          break;
  }
});

function showTooltip(x, y, content) {
    const tooltip = document.getElementById('tooltip');
    
    // 添加关闭按钮和内容包装
    tooltip.innerHTML = `
        <div class="tooltip-close" onclick="hideTooltip(); if(activeLink){activeLink.style.color='#789922'; activeLink=null;}">×</div>
        <div class="tooltip-content">
            ${content}
        </div>
    `;
    
    tooltip.style.display = 'block';
    
    // 计算位置，确保提示框不会超出视窗
    const tooltipWidth = tooltip.offsetWidth;
    const tooltipHeight = tooltip.offsetHeight;
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;

    // 调整X坐标，确保提示框不会超出右边界
    if (x + tooltipWidth > windowWidth) {
        tooltip.style.left = (x - tooltipWidth - 10) + 'px';
    } else {
        tooltip.style.left = x + 'px';
    }

    // 调整Y坐标，确保提示框不会超出下边界
    if (y + tooltipHeight > windowHeight) {
        tooltip.style.top = (y - tooltipHeight - 10) + 'px';
    } else {
        tooltip.style.top = y + 'px';
    }
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    if (tooltip) {
        tooltip.style.display = 'none';
    }
}