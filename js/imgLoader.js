
/*	简单的 图片资源加载器
 *	@param {String | Array} property 准备加载的图片或图片资源队列
 *	
 *	Public Function | Interface
 *		func completed	{Interface}		加载完成后回调(包含加载失败的情况) 请覆盖实现
 *			@param	{Integer}	arg1	加载资源总数
 *			@param	{Integer}	arg2	加载成功数量
 *			@param	{Integer}	arg3	加载失败数量
 *
 *		func progress	{Interface}		加载进度回调 请覆盖实现
 *			@param	{Integer}	arg1	加载资源总数
 *			@param	{Integer}	arg2	当前加载成功数量
 *			@param	{Integer}	arg3	当前加载失败数量
 *
 *		func start 		{Main Function}	开始执行加载
 *			return {Object}	assets 返回图片资源列表 及状态(assets[img].loaded)
 *	
 *	Property
 *		assets	{Object}	加载资源列表(含加载状态。不论是否加载成功)
 *		asset 	{Object}	加载成功 资源列表
 *
 */
function ImgLoader(property){
	var onloadedcompleted	,// 加载完成回调
		onloading			,// 加载进度回调
		NUM_ELEMENTS		,// 资源总数
		NUM_LOADED = 0		,// 已加载数量
		NUM_ERROR = 0		,// 加载错误数量
		TempProperty = {}	,// 资源列表
		LOADED_THEMES={}	,// 加载成功的资源
		loadList = [] 		;// 加载队列

	//初始化参数
	if(typeof(property) == 'string'){
		NUM_ELEMENTS=1;
		loadList[0]=property;
	}else{
		NUM_ELEMENTS=property.length;
		loadList=property;
	}
	//资源存储位置
	this.assets=TempProperty;//对象引用
	this.asset=LOADED_THEMES;
	//初始化回调函数
	this.completed=function(callback){
		onloadedcompleted=callback;
	};
	this.progress=function(callback){
		onloading=callback;
	};
	this.start=function(){
		console.log("start");
		for(var i=0;i<NUM_ELEMENTS;i++){
			load(loadList[i],imageLoaded,imageLoadError);
		}
		return TempProperty;
	};
	function load(img,loaded,error){
		//存储资源引用
		var image=new Image();

		image.onload=loaded;

		image.onerror=error;
		image.src=img;
		TempProperty[img]=image;

	};
	function imageLoaded(){
		var imgsrc=this.getAttribute("src");
		
		console.log(imgsrc);
		TempProperty[imgsrc].loaded=true;
		NUM_LOADED++;
		
		if(NUM_LOADED+NUM_ERROR==NUM_ELEMENTS){
			//加载完毕 则调用completed
			typeof(onloadedcompleted) =='function' && onloadedcompleted(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}else{
			//加载进行中...调用 onloading
			typeof(onloading) =='function' && onloading(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}
	};
	function imageLoadError(){
		var imgsrc=this.getAttribute("src");
		TempProperty[imgsrc].loaded=false;
		NUM_ERROR++;
		//加载错误后需要继续处理...
		if(NUM_LOADED+NUM_ERROR==NUM_ELEMENTS){
			//加载完毕 则调用completed
			typeof(onloadedcompleted) =='function' && onloadedcompleted(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}else{
			//加载进行中...调用 onloading
			typeof(onloading) =='function' && onloading(NUM_ELEMENTS,NUM_LOADED,NUM_ERROR);
		}
	};
};
// 使用方式
// var imgArray=[......];//图片资源数组
// var imgLoader=new ImgLoader(imgArray); //初始化加载器
// //定义加载过程中的处理方法
// imgLoader.progress(function(a,b,c){
// 	//a:加载总数
// 	//b:加载成功数
// 	//c:加载失败数
// });
// //定义加载完成时的处理方法
// imgLoader.completed(function(a,b,c){
// 	//a:加载总数
// 	//b:加载成功数
// 	//c:加载失败数
// });
// //定义完后开始执行加载
// imgLoader.start();