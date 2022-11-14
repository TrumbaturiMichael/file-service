class FileRolePermissionModel {
    constructor(fileId, roleId, userId, permission) {
      this.fileId = fileId;
      this.roleId = roleId;
      this.userId = userId;
      this.permission = permission;
    }
  }
  
  module.exports = FileRolePermissionModel;