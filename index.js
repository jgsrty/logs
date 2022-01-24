let hasInit = false;
let errorLog = {
  /*
   *格式化参数
   */
  _formatParams: data => {
    let arr = [];
    for (let name in data) {
      if (data.hasOwnProperty(name)) {
        arr.push(encodeURIComponent(name) + '=' + encodeURIComponent(data[name]));
      }
    }
    arr.push(('v=' + Math.random()).replace('.', ''));
    return arr.join('&');
  },

  /*
   *格式化日期
   */
  _formatDate: () => {
    let date = new Date();
    let Y = date.getFullYear();
    let M = date.getMonth() + 1;
    let D = date.getDate();
    let H = date.getHours();
    let Mi = date.getMinutes();
    let S = date.getSeconds();
    return `${Y}-${M}-${D} ${H}:${Mi}:${S}`;
  },

  _getSystemVersion: () => {
    let ua = window.navigator.userAgent;
    if (ua.indexOf('CPU iPhone OS ') >= 0) {
      return ua.substring(ua.indexOf('CPU iPhone OS ') + 14, ua.indexOf(' like Mac OS X'));
    } else if (ua.indexOf('Android ') >= 0) {
      return ua.substr(ua.indexOf('Android ') + 8, 3);
    } else {
      return 'other';
    }
  },

  /**
   获取设备是安卓、IOS  还是PC端
  */
  _getDevices: () => {
    let u = navigator.userAgent;
    if (/AppleWebKit.*Mobile/i.test(navigator.userAgent) || /MIDP|SymbianOS|NOKIA|SAMSUNG|LG|NEC|TCL|Alcatel|BIRD|DBTEL|Dopod|PHILIPS|HAIER|LENOVO|MOT-|Nokia|SonyEricsson|SIE-|Amoi|ZTE/.test(navigator.userAgent)) {
      if (window.location.href.indexOf('?mobile') < 0) {
        try {
          if (/iPhone|mac|iPod|iPad/i.test(navigator.userAgent)) {
            errorLog.config.isIOS = true
            return 'iPhone';
          } else {
            return 'Android';
          }
        } catch (e) {}
      }
    } else if (u.indexOf('iPad') > -1) {
      return 'iPhone';
    } else {
      return 'Android';
    }
  },
  //模块配置
  config: {},
  //获取用户相关数据的方法
  _getUserInfoFn: () => {},
  init: (config, getUserInfoFn = () => {}) => {
    // https://static.swhysc.tech/admin/finance-management/log/upload'
    let { appkey, url = 'http://192.168.31.183:3000/logs', open = true, env = 'dev', isApp = false, cacheNum = 10 } = config || {};
    if (open === false || !appkey || !url) {
      return;
    }
    if (hasInit) {
      return;
    }
    hasInit = true;
    errorLog.config = { appkey, url, cacheNum, env };
    errorLog._getUserInfoFn = getUserInfoFn;
    errorLog.config.logs = JSON.parse(sessionStorage.getItem("SW-LOGS")) || [];
    errorLog.config.interval = null
    //重写console.error
    window.console.error = (errorFn => {
      return function() {
        errorFn.apply(console, arguments);
        let message = Array.from(arguments)
        console.log(message)
        if(isApp) {
          let errorData = {
            time: errorLog._formatDate(),
            message: JSON.stringify(message),
            type: 'error'
          }
          errorLog.report({ force: false, error: errorData })
        }
      };
    })(console.error);
    // debugSW方法
    window.debugSW = console.debug = (originFun => {
      return function () {
        originFun.apply(console,arguments)
        let message = Array.from(arguments)
        // 只有在app中调用debugSW才需要上报
        if(this !== console && isApp) {
          let debugData = {
            time: errorLog._formatDate(),
            message: JSON.stringify(message),
            type: 'debug'
          }
          errorLog.report({ force: false, error: debugData })
        }
      }
    })(console.debug);
    // 监听页面离开自动上报
    document.addEventListener('visibilitychange', () => {
      if(document.visibilityState === 'hidden' && errorLog.config.logs.length > 0) {
        errorLog.report()
      }
    })
  },

  report: ({ force = true, error }) => {
    if (!hasInit) {
      return;
    }
    let params = {
      logType: 1,
      content: errorLog.config.logs
    }
    // 直接上报
    if(force && errorLog.config.logs.length > 0) {
      errorLog._sendBeacon(params)
      return
    }
    let { time, message, type } = error
    let logInfo = {
      time,
      message,
      type,
      userInfo: errorLog._getUserInfoFn(),
      projectId: errorLog.config.appkey,
      ua: window.navigator.userAgent,
      os: errorLog._getDevices(),
      osVersion: errorLog._getSystemVersion(),
      env: errorLog.config.env
    }
    errorLog.config.logs.push(logInfo);
    sessionStorage.setItem("SW-LOGS", JSON.stringify(errorLog.config.logs));
    if(errorLog.config.interval === null &&  errorLog.config.isIOS) {
      // 插入log启动计时 10秒未上报则自动提交
      errorLog.config.interval = setInterval(() => {
        errorLog._sendBeacon(params)
      },3000)
    }
    // 日志数量10条为一组进行上报
    if (errorLog.config.logs.length >= errorLog.config.cacheNum) {
      errorLog._sendBeacon(params)
    }
  },

  _sendBeacon: (params) => {
    navigator.sendBeacon(errorLog.config.url, JSON.stringify(params));
    clearInterval(errorLog.config.interval)
    errorLog.config.interval = null
    errorLog.config.logs = []
    sessionStorage.removeItem("SW-LOGS");
  }

};
export default errorLog;
