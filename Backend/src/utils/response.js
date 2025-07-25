class response {
  constructor(statusCode = 200, data = [], message = "success") {
    (this.statusCode = statusCode),
      (this.success = true),
      (this.data = data),
      (this.message = message);
  }
}

export default response
