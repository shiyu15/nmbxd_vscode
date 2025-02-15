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

        // 动态切换图片的src属性
        if (img.src.includes("thumb")) {
            // 切换到大图
            img.src = img.src.replace("thumb/", "image/");
            img.classList.add('expanded');
        } else {
            // 切换回小图
            img.src = img.src.replace("image/", "thumb/");
            img.classList.remove('expanded');
        }
    });
});


// 初始化和页面更新时都需要处理引用
document.addEventListener('DOMContentLoaded', () => {
    processQuoteLinks();
});

// 添加变量来跟踪当前激活的链接
let activeLink = null;
let tooltipTimeout = null;


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
                if (tooltipTimeout) {
                    clearTimeout(tooltipTimeout);
                    tooltipTimeout = null;
                }
                
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
            };

            newLink.onmouseout = (event) => {
                tooltipTimeout = setTimeout(() => {
                    const tooltip = document.getElementById('tooltip');
                    if (!tooltip) return;
                    
                    const tooltipRect = tooltip.getBoundingClientRect();
                    const mouseX = event.clientX;
                    const mouseY = event.clientY;

                    if (mouseX < tooltipRect.left || mouseX > tooltipRect.right || 
                        mouseY < tooltipRect.top || mouseY > tooltipRect.bottom) {
                        hideTooltip();
                        newLink.style.color = "#789922";
                        activeLink = null;
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

// const vscode = acquireVsCodeApi();

// const vsPostMessage = (command, messages) => {
//   vscode.postMessage({
//     command: command,
//     __topic: __topic,
//     ...(messages || {})
//   });
// };

// 设置标题
// vsPostMessage('setTitle', {
//   title: document.title
// });

// // 给图片添加查看图片的功能
// document.querySelectorAll('img').forEach((img) => {
//   img.onload = () => {
//     // if (img.width < 100 && img.height < 100) {
//     //   return;
//     // }
//     img.style.cursor = 'zoom-in';
//     img.onclick = () => {
//       console.log(img.src);
//       AutoResizeImage(10000, 10000, img);
//       // vsPostMessage('browseImage', {
//       //   src: img.src
//       // });
//     };
//   };
// });

// // 图片地址的a标签，点击打开图片
// const supportImageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
// supportImageTypes.forEach((type) => {
//   document.querySelectorAll(`.topic-content a[href$=".${type}"]`).forEach((a) => {
//     a.dataset['imageSrc'] = a.href;
//     // vsc中 return false 不能阻止a标签跳转。曲线救国
//     a.href = 'javascript:;';
//     a.onclick = () => {
//       console.log(a.dataset['imageSrc']);
//       vsPostMessage('browseImage', {
//         src: a.dataset['imageSrc']
//       });
//       return false;
//     };
//   });
// });

/**
 * 指向站内地址的a标签，点击在插件内打开
 * 有几种：
 * 1. 完整地址：https://www.v2ex.com/t/123456，域名也可能是v2ex.com
 * 2. 相对地址：/t/123456
 */
// document.querySelectorAll('.topic-content a[href*="/t/"]').forEach((a) => {
//   // 取帖子链接
//   let href = '';
//   if (/(\/t\/\d+)/.test(a.href)) {
//     href = 'https://www.v2ex.com' + RegExp.$1;
//   } else {
//     return;
//   }

//   a.dataset['href'] = href;
//   a.href = 'javascript:;';
//   a.onclick = () => {
//     console.log(a.dataset['href']);
//     vsPostMessage('openTopic', {
//       link: a.dataset['href']
//     });
//     return false;
//   };
// });

// 评论
// function onSubmit() {
//   const content = (document.querySelector('#replyBox').value || '').trim();
//   if (!content) {
//     return;
//   }

//   vsPostMessage('postReply', {
//     content: content
//   });
// }

// function AutoResizeImage(maxWidth, maxHeight, objImg) {
//   var img = new Image();
//   img.src = objImg.src;
//   var hRatio;
//   var wRatio;
//   var Ratio = 1;
//   var w = img.width;
//   var h = img.height;
//   wRatio = maxWidth / w;
//   hRatio = maxHeight / h;
//   if (maxWidth == 0 && maxHeight == 0) {
//     Ratio = 1;
//   } else if (maxWidth == 0) {//
//     if (hRatio < 1) Ratio = hRatio;
//   } else if (maxHeight == 0) {
//     if (wRatio < 1) Ratio = wRatio;
//   } else if (wRatio < 1 || hRatio < 1) {
//     Ratio = (wRatio <= hRatio ? wRatio : hRatio);
//   }
//   // if (Ratio < 1) {
//     w = w * Ratio;
//     h = h * Ratio;
//   // }
//   objImg.height = h;
//   objImg.width = w;
// }

// window.addEventListener('message', event => {
//   const message = event.data; // The JSON data our extension sent
//   switch (message.command) {
//       case 'updateLikes':
//           console.log('js updateLikes: ', message.reply);
//           document.querySelectorAll(`span[pid="${message.reply.pid}"]`).forEach((a) => {
//             a.innerText = message.reply.likes;
//           })
//           break;
//       case 'delLabel':
//       case 'addLabel':
//           console.log('js processLabel: ', message.reply);
//           document.querySelectorAll(`span[replyuid="${message.reply.user.uid}"]`).forEach((a) => {
//             console.log('processLabel innerText: ', a.innerText);
//             console.log('processLabel innerHTML: ', a.innerHTML);
//             let inner = '';
//             for (let i in message.reply.user.labels) {
//               inner += `<span class="label${message.reply.user.labels[i]['class']}" onclick="vsPostMessage('delLabel', {&quot;user&quot;:${escapeHTML(JSON.stringify(message.reply.user))}, &quot;label&quot;:${escapeHTML(JSON.stringify(message.reply.user.labels[i]['content']))}, &quot;__topic&quot;: ${escapeHTML(JSON.stringify(__topic))} });">${message.reply.user.labels[i]['content']}</span>`;
//             }
//             console.log('processLabel inner: ', inner);
//             a.innerHTML = inner;
//           })
//           break;
//   }
// });

// function HTMLEncode(html) {
//   var temp = document.createElement("div");
//   (temp.textContent != null) ? (temp.textContent = html) : (temp.innerText = html);
//   var output = temp.innerHTML;
//   temp = null;
//   return output;
// }

// function HTMLDecode(text) { 
//   var temp = document.createElement("div"); 
//   temp.innerHTML = text; 
//   var output = temp.innerText || temp.textContent; 
//   temp = null; 
//   return output; 
// } 

// function escapeHTML(text) {
//   text = "" + text;
//   return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");;
// }

