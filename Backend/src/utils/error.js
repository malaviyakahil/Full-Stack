class error extends Error {
  constructor(statusCode = 404, message = "something went wrong") {
    super(message),
    (this.message = message),
    (this.statusCode = statusCode),
    (this.success = false),
    (this.data = [])
  }
}

export default error