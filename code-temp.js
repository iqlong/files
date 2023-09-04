export function download(url, params, filename) {
  downloadLoadingInstance = ElLoading.service({ text: "正在下载数据，请稍候", background: "rgba(0, 0, 0, 0.7)", })
  return service.post(url, params, {
    transformRequest: [(params) => { return tansParams(params) }],
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    responseType: 'blob'
  }).then(async (data) => {
    const isLogin = await blobValidate(data);
    if (isLogin) {
      const blob = new Blob([data])
      saveAs(blob, filename)
    } else {
      const resText = await data.text();
      const rspObj = JSON.parse(resText);
      const errMsg = errorCode[rspObj.code] || rspObj.msg || errorCode['default']
      ElMessage.error(errMsg + '-not login');
    }
    downloadLoadingInstance.close();
  }).catch((r) => {
    console.error(r)
    ElMessage.error('下载文件出现错误，请联系管理员！')
    downloadLoadingInstance.close();
  })
}


// vue code 

<template>
  <div class="app-container">
    <el-row :gutter="20">
      <!--用户数据-->
      <el-col :xs="24">
        <el-form
          :model="queryParams"
          ref="queryRef"
          :inline="true"
          v-show="showSearch"
          label-width="68px"
        >
          <el-form-item label="一级分类" prop="oneCategory">
            <el-select filterable
              v-model="queryParams.oneCategory"
              placeholder="一级分类"
              clearable
              style="width: 240px"
            >
              <el-option
                v-for="dict in oneCategoryList"
                :key="dict.value"
                :label="dict.label"
                :value="dict.value"
                @click="find_twoCategoryList(dict.value, false)"
                ref="optionRef"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="二级分类" prop="twoCategory">
            <el-select filterable
              v-model="queryParams.twoCategory"
              placeholder="二级分类"
              clearable
              style="width: 240px"
            >
              <el-option
                v-for="item in twoCategoryList"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item label="工具标题" style="width: 308px" prop="title">
            <el-input v-model="queryParams.title" placeholder="Please input" />
          </el-form-item>

          <el-form-item label="状态" style="width: 308px" prop="status">
            <el-select
              v-model="queryParams.status"
              class="m-2"
              placeholder="Select"
              size="default"
            >
              <el-option
                v-for="item in form_option"
                :key="item.value"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" icon="Search" @click="handleQuery"
              >搜索</el-button
            >
            <el-button icon="Refresh" @click="resetQuery">重置</el-button>
          </el-form-item>
        </el-form>

        <el-row :gutter="10" class="mb8">
          <el-col :span="1.5">
            <el-button
              type="primary"
              plain
              icon="Plus"
              @click="handleAdd"
              v-hasPermi="['dtc:tool:add']"
              >新增</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="success"
              plain
              icon="Edit"
              :disabled="single"
              @click="handleUpdate"
              v-hasPermi="['dtc:tool:edit']"
              >修改</el-button
            >
          </el-col>
          <el-col :span="1.5">
            <el-button
              type="danger"
              plain
              icon="Delete"
              :disabled="multiple"
              @click="handleDelete"
              v-hasPermi="['dtc:tool:remove']"
              >删除</el-button
            >
          </el-col>
          <!-- <el-col :span="1.5">
            <el-button
              type="info"
              plain
              icon="Upload"
              @click="handleImport"
              v-hasPermi="['system:user:import']"
              >导入</el-button
            >
          </el-col> -->
          <el-col :span="1.5">
            <el-button
              type="warning"
              plain
              icon="Download"
              @click="handleExport"
              v-hasPermi="['dtc:tool:query']"
              >导出</el-button
            >
          </el-col>
          <right-toolbar
            v-model:showSearch="showSearch"
            @queryTable="getList"
            :columns="columns"
          ></right-toolbar>
        </el-row>

        <el-table
          v-loading="loading"
          :data="userList"
          border
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="50" align="center" />
          <el-table-column
            label="一级分类"
            align="center"
            key="oneName"
            prop="oneName"
            v-if="columns[0].visible"
          />
          <el-table-column
            label="二级分类"
            align="center"
            key="twoName"
            prop="twoName"
            v-if="columns[1].visible"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="工具标题"
            align="center"
            key="title"
            prop="title"
            v-if="columns[2].visible"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="工具网址"
            align="center"
            key="toolUrl"
            prop="toolUrl"
            v-if="columns[3].visible"
            :show-overflow-tooltip="true"
          />
          <el-table-column
            label="简介"
            align="center"
            key="introduction"
            prop="introduction"
            v-if="columns[4].visible"
            width="120"
          />
          <el-table-column
            label="logo图"
            align="center"
            key="thumbnail"
            prop="thumbnail"
            v-if="columns[5].visible"
          >
            <template #default="scope">
              <img class="logo-image" :src="scope.row.thumbnail" />
              <!-- @change="handleStatusChange(scope.row)" -->
            </template>
          </el-table-column>
          <el-table-column label="状态" align="center" prop="status">
            <template #default="scope">
              <span v-if="scope.row.status == 1">正常</span>
              <span v-else>停用</span>
            </template>
          </el-table-column>
          <el-table-column label="是否折扣" align="center" prop="isDiscount">
            <template #default="scope">
              <span v-if="scope.row.status == 1">是</span>
              <span v-else>否</span>
            </template>
          </el-table-column>
          <el-table-column
            label="排序"
            align="center"
            prop="tSort"
            v-if="columns[6].visible"
          >
          </el-table-column>
          <el-table-column label="备注" align="center" prop="remark">
          </el-table-column>

          <el-table-column
            label="操作"
            align="center"
            width="150"
            class-name="small-padding fixed-width"
          >
            <template #default="scope">
              <el-tooltip
                content="修改"
                placement="top"
                v-if="scope.row.userId !== 1"
              >
                <el-button
                  type="text"
                  icon="Edit"
                  @click="handleUpdate(scope.row)"
                  v-hasPermi="['system:user:edit']"
                ></el-button>
              </el-tooltip>
              <el-tooltip
                content="删除"
                placement="top"
                v-if="scope.row.userId !== 1"
              >
                <el-button
                  type="text"
                  icon="Delete"
                  @click="handleDelete(scope.row)"
                  v-hasPermi="['system:user:remove']"
                ></el-button>
              </el-tooltip>
            </template>
          </el-table-column>
        </el-table>
        <pagination
          v-show="total > 0"
          :total="total"
          v-model:page="queryParams.pageNum"
          v-model:limit="queryParams.pageSize"
          @pagination="getList"
        />
      </el-col>
    </el-row>

    <!-- 添加或修改用户配置对话框 -->
    <el-dialog :title="title" :before-close="cancel" v-model="open" width="600px" append-to-body>
      <el-form :model="form" label-width="80px" ref="userRef">
        <el-form-item label="一级分类" prop="oneCategory" required>
          <el-select filterable
            v-model="form.oneCategory"
            placeholder="一级分类"
            clearable
            required
            style="width: 240px"
          >
            <el-option
              v-for="dict in oneCategoryList"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
              @click="find_twoCategoryList(dict.value, true)"
              ref="optionRef"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="二级分类" prop="twoCategory">
          <el-select filterable
            v-model="form.twoCategory"
            placeholder="二级分类"
            clearable
            style="width: 240px"
          >
            <el-option
              v-for="dict in twoCategoryList_dialog"
              :key="dict.value"
              :label="dict.label"
              :value="dict.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item
          label="工具标题"
          required
          style="width: 308px"
          prop="title"
        >
          <el-input v-model="form.title" placeholder="Please input" />
        </el-form-item>
        <el-form-item
          label="工具链接"
          required
          style="width: 308px"
          prop="toolUrl"
        >
          <el-input v-model="form.toolUrl" placeholder="Please input" />
        </el-form-item>
        <el-form-item label="简介" required prop="introduction">
          <el-input
            type="textarea"
            v-model="form.introduction"
            placeholder="请输入"
            maxlength="30"
          />
        </el-form-item>
        <el-form-item label="logo图" prop="thumbnail">
          <el-upload
            ref="uploadRef"
            :limit="1"
            :headers="upload.headers"
            :action="upload.url + '?updateSupport=' + upload.updateSupport"
            :disabled="upload.isUploading"
            :on-progress="handleFileUploadProgress"
            :on-success="handleFileSuccess"
            drag
          >
          <!-- :auto-upload="false" -->

            <img v-if="form.thumbnail" :src="form.thumbnail" class="avatar">
            <div v-else>
              <el-icon class="el-icon--upload"><upload-filled /></el-icon>
              <div class="el-upload__text">
                将图片拖到此处，或<em>点击上传</em>
              </div> 
            </div>
            
          </el-upload>
          
          <!-- <div class="dialog-footer">
            <el-button type="primary" @click="submitFileForm">确 定</el-button>
            <el-button @click="upload.open = false">取 消</el-button>
          </div> -->
        </el-form-item>
        <el-form-item label="状态" required prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">正常</el-radio>
            <el-radio :label="0">停用</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="是否折扣">
          <el-radio-group v-model="form.isDiscount">
            <el-radio :label="1">是</el-radio>
            <el-radio :label="0">否</el-radio>
          </el-radio-group>
        </el-form-item>

        <el-form-item label="排序" prop="tSort">
          <el-input v-model="form.tSort" />
        </el-form-item>

        <el-form-item label="备注">
          <el-input
            v-model="form.remark"
            type="textarea"
            placeholder="请输入内容"
          ></el-input>
        </el-form-item>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button type="primary" @click="submitForm()">确 定</el-button>
          <el-button @click="cancel">取 消</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- 用户导入对话框 -->
    <el-dialog
      :title="upload.title"
      v-model="upload.open"
      width="400px"
      append-to-body
    >
    </el-dialog>
  </div>
</template>

<script setup name="User">
import { getToken } from "@/utils/auth";
import { treeselect } from "@/api/system/dept";
import { objectToFormData, ifSuccessCode } from "@/utils/toolFunction.js";
import {
  toolList,
  listClassify,
  toolList_edit,
  toolList_add,
  toolList_delete,
  toolType_export,
} from "@/api/dtc-manage/tool";
import { ref, onMounted } from 'vue';

const router = useRouter();
const { proxy } = getCurrentInstance();
const { sys_normal_disable, sys_user_sex } = proxy.useDict(
  "sys_normal_disable",
  "sys_user_sex"
);

const formDataTemplate = [
  "oneCategory",
  "twoCategory",
  "twoName",
  "oneName",
  "title",
  "toolUrl",
  "introduction",
  "thumbnail",
  "status",
  "isDiscount",
  "tSort",
  "remark",
  "id",
];
const dialogRef = ref(null);
// 判断dialog是走新增还是修改接口
const ifEdit = ref(false);
const queryRef = ref(null);
const userList = ref([]);
const open = ref(false);
const loading = ref(true);
const showSearch = ref(true);
const ids = ref([]);
const single = ref(true);
const multiple = ref(true);
const total = ref(0);
const title = ref("");
const dateRange = ref([]);
const deptName = ref("");
const deptOptions = ref(undefined);
const initPassword = ref(undefined);
const postOptions = ref([]);
const roleOptions = ref([]);
/*** 用户导入参数 */
const upload = reactive({
  // 是否显示弹出层（用户导入）
  open: false,
  // 弹出层标题（用户导入）
  title: "",
  // 是否禁用上传
  isUploading: false,
  // 是否更新已经存在的用户数据
  updateSupport: 0,
  // 设置上传的请求头部
  headers: { Authorization: "Bearer " + getToken() },
  // 上传的地址
  url: import.meta.env.VITE_APP_BASE_API + "/common/upload",
});
// 列显隐信息
const columns = ref([
  { key: 0, label: `一级分类`, visible: true },
  { key: 1, label: `二级分类`, visible: true },
  { key: 2, label: `工具标题`, visible: true },
  { key: 3, label: `工具网址`, visible: true },
  { key: 4, label: `简介`, visible: true },
  { key: 5, label: `logo图`, visible: true },
  { key: 6, label: `状态`, visible: true },
]); 

const form_option = [
  {
    value: "",
    label: "所有",
  },
  {
    value: 1,
    label: "正常",
  },
  {
    value: 0,
    label: "停用",
  },
];
const reactive_data = reactive({
  form: {},
  queryParams: {
    pageNum: 1,
    pageSize: 10,
    orderByColumn: "tSort",
    isAsc: "asc",
    oneCategory: undefined,
    twoCategory: undefined,
    title: undefined,
    status: undefined,
  },
  rules: {
    userName: [
      { required: true, message: "二级分类不能为空", trigger: "blur" },
      {
        min: 2,
        max: 20,
        message: "二级分类长度必须介于 2 和 20 之间",
        trigger: "blur",
      },
    ],
    nickName: [
      { required: true, message: "工具标题不能为空", trigger: "blur" },
    ],
    password: [
      { required: true, message: "用户密码不能为空", trigger: "blur" },
      {
        min: 5,
        max: 20,
        message: "用户密码长度必须介于 5 和 20 之间",
        trigger: "blur",
      },
    ],
    email: [
      {
        type: "email",
        message: "请输入正确的邮箱地址",
        trigger: ["blur", "change"],
      },
    ],
    phonenumber: [
      {
        pattern: /^1[3|4|5|6|7|8|9][0-9]\d{8}$/,
        message: "请输入正确的简介",
        trigger: "blur",
      },
    ],
  },
});
let oneCategoryList = reactive([]);
let twoCategoryList = reactive([]);
let twoCategoryList_dialog = reactive([]);

const { queryParams, form, rules } = toRefs(reactive_data);

/** 通过条件过滤节点  */
const filterNode = (value, data) => {
  if (!value) return true;
  return data.label.indexOf(value) !== -1;
};
/** 根据名称筛选工具网址树 */
watch(deptName, (val) => {
  proxy.$refs["deptTreeRef"].filter(val);
});
/** 查询工具网址下拉树结构 */
function getTreeselect() {
  treeselect().then((response) => {
    deptOptions.value = response.data;
  });
}

function beforeAvatarUpload(file) {
  const isJPG = file.type === "image/jpeg";
  const isLt2M = file.size / 1024 / 1024 < 2;

  if (!isJPG) {
    this.$message.error("上传头像图片只能是 JPG 格式!");
  }
  if (!isLt2M) {
    this.$message.error("上传头像图片大小不能超过 2MB!");
  }
  return isJPG && isLt2M;
}

/** 查询用户列表 */
function getList(type) {
  loading.value = true;
  // const data = objectToFormData(proxy.addDateRange(queryParams.value, dateRange.value))
  const data = objectToFormData(queryParams.value);

  toolList(data).then((res) => {
    loading.value = false;
    userList.value = res.rows;
    total.value = res.total;
    type == "search" &&
      ifSuccessCode(res.code) &&
      proxy.$modal.msgSuccess("查询成功");
  });
}
/** 节点单击事件 */
function handleNodeClick(data) {
  queryParams.value.deptId = data.id;
  handleQuery();
}
/** 搜索按钮操作 */
function handleQuery() {
  queryParams.value.pageNum = 1;
  getList("search");
}
/** 重置按钮操作 */
function resetQuery() {
  dateRange.value = [];
  proxy.resetForm("queryRef");
  handleQuery();
}
/** 删除按钮操作 */
function handleDelete(row) {
  const userIds = row.id || ids.value;
  proxy.$modal
    .confirm('是否确认删除工具"' + row.title + '"的数据项？')
    .then(function () {
      return toolList_delete({
        ids: userIds,
      });
    })
    .then((data) => {
      getList();
      ifSuccessCode(data.code) && proxy.$modal.msgSuccess("删除成功");
    })
    .catch((e) => {
      console.log(e);
    });
}
/** 导出按钮操作 */
function handleExport() {
  proxy.download(
    "/bac/dtc/tool/excelExport",
    {
      ...userList.value,
    },
    `user_${new Date().getTime()}.xlsx`
  );
  // toolType_export().then(() => {

  // })
}
/** 用户logo图修改  */
function handleStatusChange(row) {
  let text = row.status === "0" ? "启用" : "停用";
  proxy.$modal
    .confirm('确认要"' + text + '""' + row.userName + '"用户吗?')
    .then(function () {
      return changeUserStatus(row.userId, row.status);
    })
    .then(() => {
      proxy.$modal.msgSuccess(text + "成功");
    })
    .catch(function () {
      row.status = row.status === "0" ? "1" : "0";
    });
}
/** 更多操作 */
function handleCommand(command, row) {
  switch (command) {
    case "handleResetPwd":
      handleResetPwd(row);
      break;
    case "handleAuthRole":
      handleAuthRole(row);
      break;
    default:
      break;
  }
}
/** 跳转角色分配 */
function handleAuthRole(row) {
  const userId = row.userId;
  router.push("/system/user-auth/role/" + userId);
}
/** 重置密码按钮操作 */
function handleResetPwd(row) {
  proxy
    .$prompt('请输入"' + row.userName + '"的新密码', "提示", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      closeOnClickModal: false,
      inputPattern: /^.{5,20}$/,
      inputErrorMessage: "用户密码长度必须介于 5 和 20 之间",
    })
    .then(({ value }) => {
      resetUserPwd(row.userId, value).then((response) => {
        proxy.$modal.msgSuccess("修改成功，新密码是：" + value);
      });
    })
    .catch(() => {});
}
/** 选择条数  */
function handleSelectionChange(selection) {
  ids.value = selection.map((item) => item.id);
  single.value = selection.length != 1;
  multiple.value = !selection.length;
} 
/**上传中处理 */
const handleFileUploadProgress = (event, file, fileList) => {
  upload.isUploading = true;
};
/** 上传成功处理 */
const handleFileSuccess = (response, file, fileList) => {
  upload.open = false;
  upload.isUploading = false;
  proxy.$refs["uploadRef"].handleRemove(file); 
  // form.value.thumbnail = URL.createObjectURL(file.raw);
  form.value.thumbnail = response.url
  proxy.$alert(
    "<div style='overflow: auto;overflow-x: hidden;max-height: 70vh;padding: 10px 20px 0;'>" +
      response.msg +
      "</div>",
    "上传结果",
    { dangerouslyUseHTMLString: true }
  );
};
/** 提交上传文件 */
function submitFileForm() {
  proxy.$refs["uploadRef"].submit();
}
/** 重置操作表单 */
function reset() {
  proxy.resetForm("userRef");
  form.value = {}
}
/** 取消按钮 */
function cancel() {
  reset();
  open.value = false;
}
/** 新增按钮操作 */
function handleAdd() {
  ifEdit.value = false;
  reset();

  find_twoCategoryList(queryParams.value.oneCategory, true);
  open.value = true;
  title.value = "新增dtc工具";
}
/** 修改按钮操作 */
function handleUpdate(row) {
  reset();
  ifEdit.value = true;
  const id = row.id || ids.value;
  find_twoCategoryList(queryParams.value.oneCategory, true);
  open.value = true;
  title.value = "修改dtc工具";
  if (ids.value.length) {
    userList.value.some((item) => {
      if (item.id == ids.value[0]) {
        row = item;
      }
      return item.id == ids.value[0];
    });
  }
  for (let key in row) {
    if (formDataTemplate.indexOf(key) !== -1) {
      form.value[key] = row[key];
    }
  }
}
/** 修改 - 提交按钮 */
function submitForm() {
  proxy.$refs["userRef"].validate((valid) => {
    
    if (valid) {
      if (ifEdit.value) {
        // 当是调用修改接口的时候
        toolList_edit(form.value).then((data) => {
          ifSuccessCode(data.code)
            ? proxy.$modal.msgSuccess("修改成功")
            : proxy.$modal.msgSuccess("修改失败");
          getList();
          open.value = false;
        });
      } else {
        // 调用新增接口的时候
        toolList_add(form.value).then((data) => {
          ifSuccessCode(data.code)
            ? proxy.$modal.msgSuccess("新增成功")
            : proxy.$modal.msgSuccess("新增失败");
          getList();
          open.value = false;
        });
      }
    }
  });
}

// 点击第一个分类获取第二个分类
function find_twoCategoryList(id, ifDialog) {
  listClassify(objectToFormData({ parentId: id })).then((data) => {
    if (ifDialog) {
      // twoCategoryList_dialog = [];
      twoCategoryList_dialog.length = 0;
      data.forEach((item) => {
        if (item.parentId == id) {
          twoCategoryList_dialog.push({
            label: item.typeName,
            value: item.id,
          });
        }
      });
    } else {
      // twoCategoryList = [];
      twoCategoryList.length = 0;
      data.forEach((item) => {
        if (item.parentId == id) {
          twoCategoryList.push({
            label: item.typeName,
            value: item.id,
          });
        }
      });
    }
  });
}


onMounted(() => {
  // console.log('dom', queryRef.value.className, queryRef.value.clearValidate);
  
  getList();
  listClassify().then((data) => {
    data.forEach((item) => {
      if (item.typeLevel == 1) {
        oneCategoryList.push({
          label: item.typeName,
          value: item.id,
        });
      }
    });
  });
});
</script>

<style scoped>
:deep(.logo-image) {
  width: 32px;
  height: 32px;
}
:deep(.el-upload-dragger) {
  display: flex;
  justify-content: center;
}

:deep(.avatar-uploader .el-upload) {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}
:deep(.avatar-uploader .el-upload:hover) {
  border-color: #409eff;
}
:deep(.avatar-uploader-icon) {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}
:deep(.avatar) {
  width: 178px;
  height: 178px;
  display: block;
}
</style>
