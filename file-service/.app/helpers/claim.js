class Claim {
  constructor(data) {
    this.auth = data.auth;
    this.userid = data.userid;
    this.role = data.role;
    this.service = data.service;
    this.hop = data.hop;
  }

  isAuthenticated() {
    return this.auth;
  }

  reduceHop() {
    this.hop--;
  }

  setService(serviceName) {
    this.service = serviceName;
  }

  getUserId() {
    return this.userid != -1 ? this.userid : null;
  }

  getRoleId() {
    return this.role != 0 ? this.role : null;
  }
}

module.exports = Claim;