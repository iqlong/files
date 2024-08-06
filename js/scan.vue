<template>
  <view>
    <!-- uView的自定义导航栏,背景设置为透明 -->
    <!-- <navbar
      :title="$t('common.scan')"
      @leftClick="closed"
      :titleStyle="{ fontWeight: '600', color: '#ffffff' }"
      bgColor="transparent"
      leftIconColor="#ffffff"
    ></navbar> -->
    <!-- 扫描仪占位符 -->
    <navbar
      textInfo="扫码"
      textAlign="center"
      :isRightFunBtn="true"
      @rightNavBarClick="openLog"
    ></navbar>
    <view id="reader"></view>
  </view>
</template>

<script>
import { Html5Qrcode } from "html5-qrcode";
export default {
  data() {
    return {
      html5QrCode: null,
    };
  },
  mounted() {
    this.useCamera(); // 打开相机
  },
  methods: {
    // 关闭扫一扫页面，返回上一页
    closed() {
      this.html5QrCode.stop().finally(() => {
        this.html5QrCode.clear();
        uni.navigateBack();
      });
    },
    async scanRes(qr, err) {
      // 修改上一个页面的数据，传递qr
      // test qr: "/generalTransfer/pages/qr?businessType=training&businessKey=142&orgId=27009365"
      var pages = getCurrentPages();
      var prevPage = pages[pages.length - 2];
      prevPage.$vm.scanResult = { qr, err };
      // 上面是网上代码示例，下面是迁移小程序的后续操作
      if (qr) {
        let pos = qr.indexOf("#") + 1;
        // 将有的陆岸的的二维码的qr对应的url改为现在的
        let rowUrl = qr.slice(pos);
        let url = rowUrl.replace(/^.*\?/, "/generalTransfer/pages/qr?");
        console.log(url, "result");
        // 此处的$nextTick和setTimeout是为了解决IOS15、16 uni.scanCode 扫码后页面跳转卡死问题：https://ask.dcloud.net.cn/question/160090
        await this.$nextTick();
        setTimeout(() => {
          uni.navigateTo({
            url: url,
            fail: function () {
              uni.showToast({
                title: "该二维码无效",
                icon: "none",
              });
            },
          });
        }, 2000);
      }
    },
    // 成功回调
    onScanSuccess(qr) {
      this.scanRes(qr);
      this.closed();
    },
    useCamera() {
      // 实例化，接收元素id作为参数
      this.html5QrCode = new Html5Qrcode("reader");
      // 获取相机设备
      Html5Qrcode.getCameras()
        .then((devices) => {
          // 扫码配置
          const config = {
            fps: 10, //  二维码扫描每秒帧数
            qrbox: {
              width: 300,
              height: 300,
            }, // UI框的大小
            aspectRatio: 1.777778,
          };
          if (devices && devices.length) {
            let cameraId = devices[devices.length - 1].id; //后置摄像头，一般最后一个是后置摄像头
            //let cameraId = devices[0].id //前置摄像头
            this.html5QrCode
              .start(
                { deviceId: { exact: cameraId } },
                config,
                this.onScanSuccess
              )
              .catch((err) => {
                this.scanRes(undefined, err);
                uni.navigateBack();
              });
          } else {
            // 如果没有找到设备，直接启用摄像头
            //environment：后置摄像头  user：前置摄像头
            this.html5QrCode
              .start({ facingMode: "environment" }, config, this.onScanSuccess)
              .catch((err) => {
                this.scanRes(undefined, err);
                uni.navigateBack();
              });
          }
        })
        .catch((err) => {
          this.scanRes(undefined, err);
          uni.navigateBack();
        });
    },
  },
};
</script>


<style lang="scss" scoped>
#reader {
  // height: 100vh;
  video {
    // height: 100vh;
  }
}
</style>