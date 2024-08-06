<template>
  <view class="page-container my-page">
    <view class="userback">
      <image class="userbackImg" src="~@/static/image/my/navigate_head.png" />
      <view class="userbackContent">
        <image class="userimg" src="~@/static/image/my/avatar.svg" />
        <view>
          <view class="userName-wrap">
            <view class="userName">{{ userInfo.loginName || "" }}</view>
            <view class="toggle" @click="toggleHandler">
              <view class="toggle_text">切换</view>
              <image
                class="toggle_icon"
                src="~@/static/image/my/switchIcon.png"
              />
            </view>
          </view>
          <view class="userOrgan">{{ userInfo.currentPartyName || "" }}</view>
          <view class="userDepartment">{{
            userInfo.currentRoleName || ""
          }}</view>
        </view>
      </view>
    </view>
    <view class="content">
      <view class="top-menu">
        <view class="head">我的应用</view>
        <view class="box">
          <view
            class="menu_item"
            @tap="toPage(item)"
            v-for="(item, index) in appList"
            :key="index"
          >
            <image class="icon" :src="item.icon" />
            <text class="text">{{ item.name }}</text>
          </view>
        </view>
      </view>
      <view class="bottom-menu">
        <view class="list">
          <view
            class="menu_item"
            @tap="toPage(item)"
            v-for="(item, index) in menuList"
            :key="index"
          >
            <view class="left">
              <image class="icon" :src="item.icon" />
              <text class="text">{{ item.title }}</text>
            </view>
            <uni-icons type="forward" size="16" color="#575B66"></uni-icons>
          </view>
          <!-- <view class="menu_item" @tap="codeClick">
            <view class="left">
              <image class="icon" src="@/static/image/my/scanCode.svg" />
              <text class="text" style="margin-left: 10rpx">扫码</text>
            </view>
            <uni-icons type="forward" size="16" color="#575B66"></uni-icons>
          </view> -->
          <!-- scancode -->
          <view class="menu_item" @tap="scancode">
            <view class="left">
              <image class="icon" src="@/static/image/my/scanCode.svg" />
              <text class="text" style="margin-left: 10rpx">扫码</text>
              <view id="reader" style="display: none"></view>
            </view>
            <uni-icons type="forward" size="16" color="#575B66"></uni-icons>
          </view>
          <view class="menu_item" @tap="toHelp">
            <view class="left">
              <uni-icons type="help" size="22" color="#000"></uni-icons>
              <text class="text" style="margin-left: 10rpx">帮助中心</text>
            </view>
            <uni-icons type="forward" size="16" color="#575B66"></uni-icons>
          </view>
        </view>
        <view class="version">版本号 V{{ version }}</view>
      </view>
    </view>

    <custom-tabbar :currentItem="2"></custom-tabbar>
    <common-popup
      ref="logoutPopup"
      popupContent="确认退出登录?"
      @rightFunction="gotoLogin"
    ></common-popup>
    <uni-popup ref="popup" type="top" background-color="#fff">
      <scroll-view class="container" scroll-y>
        <view class="list">
          <view
            :class="[
              'item',
              userInfo.currentPartyId == item.orgId ? 'active' : '',
            ]"
            v-for="item in userInfo.groups"
            :key="item.orgId"
            @tap="toggleCompany(item)"
          >
            {{ item.companyName }}
          </view>
        </view>
      </scroll-view>
    </uni-popup>
  </view>
</template>
<script>
import { VERSION } from "@/common/constant.js";
import parent from "@/service/index.js";
import { findMyAccount, getMyidentity, refreshInfo } from "@/api/common.js";
import { findSettingByPersonId } from "@/api/checkTask.js";
import { reloadCurrentPage } from "@/common/util.js";
import CustomeTabbar from "@/components/custom-tabbar/custom-tabbar";
import CommonUploadFile from "@/components/common-upload-file/common-upload-file";

// #ifdef H5
import { Html5Qrcode } from "html5-qrcode";

// #endif
export default {
  components: {
    CustomeTabbar,
    CommonUploadFile,
  },
  data() {
    return {
      // #ifdef H5
      scanResult: {}, // 扫码结果
      // #endif
      userInfo: {},
      appList: [
        {
          name: "我的任务",
          route: "",
          icon: "/static/image/my/task.svg",
        },
        {
          name: "我的证书",
          route: "",
          icon: "/static/image/my/certificates.svg",
        },
        {
          name: "我的培训",
          route: "",
          icon: "/static/image/my/train.svg",
        },
        {
          name: "我的违章",
          route: "",
          icon: "/static/image/my/violation.svg",
        },
      ],
      menuList: [
        {
          icon: "/static/image/my/privacy.svg",
          title: "隐私协议",
          route: "/pages/tabBar/my/privacy",
        },
        {
          icon: require("@/static/image/my/person.png"),
          title: "个人设置",
          route: "/pages/tabBar/my/person",
        },
        // {
        // 	icon: "/static/image/my/privacy.svg",
        // 	title: "修改密码",
        // 	route: "/pages/tabBar/my/password",
        // },
        {
          icon: "/static/image/my/logout.svg",
          title: "退出登录",
          route: "/pages/tabBar/my/setting",
        },
      ],
      version: VERSION,
    };
  },
  onLoad() {},
  onShow() {
    // uni.hideHomeButton();
    // 获取用户信息
    const { currentPartyName, loginName } = uni.getStorageSync("loginInfo");
    this.userInfo = {
      currentPartyName,
      loginName,
    };
    this.fetchMyIdentity();
    this.$nextTick(() => {
      reloadCurrentPage(this, true);
    });
  },
  methods: {
    toPage(item) {
      if (item.title == "退出登录") {
        this.$refs.logoutPopup.open();
      } else if (!item.route) {
        uni.showToast({
          icon: "none",
          title: "功能开发中...",
        });
      } else {
        uni.navigateTo({
          url: `${item.route}`,
        });
      }
    },
    //
    codeClick() {
      uni.scanCode({
        onlyFromCamera: true,
        success: async (res) => {
          console.log(res, "是二维码的res信息");
          if (res.result) {
            let pos = res.result.indexOf("#") + 1;
            // 将有的陆岸的的二维码的qr对应的url改为现在的
            let rowUrl = res.result.slice(pos);
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
            }, 1800);
          }
        },

        fail: function (err) {
          uni.showToast({
            title: "扫码失败",
            icon: "none",
          });
        },
      });
    },

    // 扫描二维码
    async scancode() {
      let that = this;
      // #ifdef APP-PLUS
      // APP使用uni自带的API
      uni.scanCode({
        scanType: ["qrCode"],
        success: (res) => {
          that.handleScan(res.result);
        },
      });
      // #endif
      // #ifdef H5
      uni.showActionSheet({
        itemList: ["扫描二维码", "选择二维码图片"],
        success(res) {
          if (!res.tapIndex) {
            // 去扫码页面
            uni.navigateTo({
              url: "/managerWatch/h5Scan/scan",
            });
          } else {
            // 选择二维码图片
            uni.chooseImage({
              count: 1,
              success: function (res) {
                const tempFilePath = res.tempFiles[0];
                const html5QrCode = new Html5Qrcode(/* element id */ "reader");
                // 使用 scanFile() 方法扫描图片文件中的二维码
                html5QrCode
                  .scanFile(tempFilePath, true)
                  .then((qr) => {
                    // 成功扫描并解析二维码
                    if (qr) {
                      let pos = qr.indexOf("#") + 1;
                      // 将有的陆岸的的二维码的qr对应的url改为现在的
                      let rowUrl = qr.slice(pos);
                      let url = rowUrl.replace(
                        /^.*\?/,
                        "/generalTransfer/pages/qr?"
                      );
                      console.log(url, "result");
                      // 此处的$nextTick和setTimeout是为了解决IOS15、16 uni.scanCode 扫码后页面跳转卡死问题：https://ask.dcloud.net.cn/question/160090
                      // await this.$nextTick();
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
                  })
                  .catch((err) => {
                    // 处理错误
                    console.log('scan error: ', err);
                  });
              },
            });
          }
        },
      });
      // #endif
    },
    // 跳转至帮助中心
    toHelp() {
      uni.navigateTo({
        url: "/packageHelp/pages/helpList/helpList",
      });
    },
    toggleCompany({ orgId, userId }) {
      const params = {
        partyId: orgId,
        userId,
      };
      const options = {
        showLoading: true,
      };
      refreshInfo(params, options).then((res) => {
        this.$refs.popup.close();
        this.fetchMyIdentity();
        this.getSettingByPersonId();
      });
    },
    gotoLogin() {
      if (uni.getStorageSync("logId")) {
        parent.pms_post(
          "/api/oauth/appLogout",
          {
            id: uni.getStorageSync("logId"),
            authHeader: uni.getStorageSync("loginToken"),
          },
          {
            noToken: true,
          }
        );
        uni.removeStorageSync("loginToken");
        uni.removeStorageSync("user");
        uni.reLaunch({
          url: "/pages/login/login",
        });
      } else {
        uni.removeStorageSync("loginToken");
        uni.removeStorageSync("user");
        uni.reLaunch({
          url: "/pages/login/login",
        });
      }
    },
    // 切换公司时候获取当前公司是否设置了包含下级
    getSettingByPersonId() {
      const options = {
        showLoading: true,
      };
      findSettingByPersonId({}, options).then((res) => {
        if (res) {
          uni.setStorageSync("containLowerFlag", res.containLowerFlag);
        } else {
          uni.setStorageSync("containLowerFlag", false);
        }
      });
    },
    // 获取用户信息
    fetchMyIdentity() {
      getMyidentity(
        {},
        {
          showLoading: true,
        }
      ).then((res) => {
        this.userInfo = res;
        uni.setStorageSync("loginInfo", res);
      });
    },
    toggleHandler() {
      this.$refs.popup.open();
    },
  },
};
</script>
<style lang="scss">
.my-page {
  height: 100vh;

  .userback {
    position: relative;
    width: 100%;
    height: 400rpx;

    .userbackImg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 400rpx;
      background-repeat: no-repeat;
      background-size: 100% 100%;
    }

    .userbackContent {
      width: 100%;
      position: absolute;
      top: 138;
      left: 0;
      font-family: PingFangSC, PingFang SC;
      font-weight: 400;
      font-size: 28rpx;
      color: #ffffff;
      line-height: 40rpx;
      text-align: left;
      font-style: normal;

      .userimg {
        margin-left: 15px;
        margin-top: 138rpx;
        width: 64px;
        height: 64px;
        border-radius: 16rpx;
      }

      .userName-wrap {
        position: absolute;
        display: flex;
        left: 95px;
        top: 138rpx;
        font-size: 16px;
        padding-right: 190rpx;

        .toggle {
          width: 140rpx;
          display: flex;
          align-items: center;
          font-size: 22rpx;
          color: #fff;

          .toggle_text {
            margin-right: 10rpx;
            margin-left: 20rpx;
          }

          .toggle_icon {
            width: 24rpx;
            height: 24rpx;
          }
        }

        .userName {
          width: 260rpx;
          font-size: 16px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .userOrgan {
        padding-right: 20rpx;
        position: absolute;
        left: 95px;
        top: 182rpx;
      }

      .userDepartment {
        color: white;
        padding-right: 20rpx;
        box-sizing: border-box;
        position: absolute;
        left: 95px;
        top: 222rpx;
      }
    }
  }

  .content {
    width: 100%;
    height: calc(100% - 400rpx - 130rpx + 72rpx - 44rpx);
    padding-left: 22rpx;
    padding-right: 24rpx;
    box-sizing: border-box;
    position: relative;
    top: -72rpx;
    display: flex;
    flex-direction: column;

    .top-menu {
      flex-shrink: 0;
      width: 100%;
      background: #ffffff;
      border-radius: 8rpx;
      box-sizing: border-box;
      padding: 26rpx 22rpx;
      margin-bottom: 20rpx;

      .head {
        font-family: PingFangSC, PingFang SC;
        font-weight: 600;
        font-size: 32rpx;
        color: #333333;
        line-height: 44rpx;
        text-align: left;
        font-style: normal;
        margin-bottom: 32rpx;
      }

      .box {
        width: 100%;
        display: flex;
        align-items: center;
      }

      .menu_item {
        width: 25%;
        display: flex;
        flex-direction: column;
        align-items: center;

        .icon {
          width: 88rpx;
          height: 88rpx;
          margin-bottom: 12rpx;
        }

        .text {
          font-family: PingFangSC, PingFang SC;
          font-weight: 400;
          font-size: 28rpx;
          color: #333333;
          line-height: 36rpx;
          text-align: left;
          font-style: normal;
        }
      }
    }

    .bottom-menu {
      flex: 1;
      width: 100%;
      background: #ffffff;
      border-radius: 8rpx;
      box-sizing: border-box;
      padding: 26rpx 24rpx;
      display: flex;
      flex-direction: column;
      justify-content: space-between;

      .list {
        .menu_item {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20rpx;
          box-sizing: border-box;
          border-bottom: 1px solid #f0f0f0;
          background: #fff;

          .left {
            flex: 1;
            display: flex;
            align-items: center;

            .icon {
              width: 36rpx;
              height: 36rpx;
              margin-right: 20rpx;
            }
          }
        }
      }

      .version {
        width: 100%;
        font-family: PingFangSC, PingFang SC;
        font-weight: 400;
        font-size: 24rpx;
        color: #888888;
        line-height: 34rpx;
        text-align: center;
        font-style: normal;
      }
    }
  }

  .container {
    max-height: 600rpx;
    overflow: hidden;
    margin-top: 80rpx;

    .item {
      width: 100%;
      padding: 16rpx 20rpx;
      box-sizing: border-box;
      border-bottom: 1px solid #dddddd;
    }
  }
}
</style>
