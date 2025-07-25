let asyncHandler =(fun) => (req,res,next)=>{
  fun(req,res,next).catch((error) => next(error))
}

export default asyncHandler