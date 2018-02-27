var THREEx = THREEx || {}

THREEx.Portal360 = function(videoImageURL, doorWidth, doorHeight, radius){	

	this.update1 = this.update1.bind(this);
	this.update2 = this.update2.bind(this);
	this.update3 = this.update3.bind(this);
	this.update4 = this.update4.bind(this);
			/// 
	this.deviceMotionInterval = 0;
	this.dt = 0.015;
	this.phi = Math.PI/2;
	this.theta = Math.PI/2;

	this.target = new THREE.Vector3();	
	this.update = this.update1;
	
	var doorCenter = new THREE.Group
	doorCenter.position.y = doorHeight/2
	this.object3d = doorCenter

	//////////////////////////////////////////////////////////////////////////////
	//		build texture360
	//////////////////////////////////////////////////////////////////////////////
	var isVideo = videoImageURL.match(/.(mp4|webm|ogv)/i) ? true : false
	if( isVideo ){
		var video = document.createElement( 'video' )
		video.width = 640;
		video.height = 360;
		video.loop = true;
		video.muted = true;
		video.src = videoImageURL;
		video.crossOrigin = 'anonymous'
		video.setAttribute( 'webkit-playsinline', 'webkit-playsinline' );
		video.play();

		var texture360 = new THREE.VideoTexture( video );
		texture360.minFilter = THREE.LinearFilter;
		texture360.format = THREE.RGBFormat;	
		texture360.flipY = false;		
	}else{
		var texture360 = new THREE.TextureLoader().load(videoImageURL)
		texture360.minFilter = THREE.NearestFilter;
		texture360.format = THREE.RGBFormat;
		texture360.flipY = false;		
	}

	//////////////////////////////////////////////////////////////////////////////
	//		build mesh
	//////////////////////////////////////////////////////////////////////////////

	// create insideMesh which is visible IIF inside the portal
	var insideMesh = this._buildInsideMesh(texture360, doorWidth, doorHeight)
	doorCenter.add(insideMesh)
	this.insideMesh = insideMesh

	// create outsideMesh which is visible IIF outside the portal
	var outsideMesh = this._buildOutsideMesh(texture360, doorWidth, doorHeight)
	doorCenter.add(outsideMesh)
	this.outsideMesh = outsideMesh

	// create frameMesh for the frame of the portal
	var frameMesh = this._buildRectangularFrame(doorWidth/100, doorWidth, doorHeight)
	doorCenter.add(frameMesh)
}
//////////////////////////////////////////////////////////////////////////////
//		Code Separator
//////////////////////////////////////////////////////////////////////////////
THREEx.Portal360.buildTransparentMaterial = function(){
	// if there is a cached version, return it
	if( THREEx.Portal360.buildTransparentMaterial.material ){
		return THREEx.Portal360.buildTransparentMaterial.material
	}
	var material = new THREE.MeshBasicMaterial({
		colorWrite: false // only write to z-buf
	})
	// an alternative to reach the same visual - this one seems way slower tho. My guess is it is hitting a slow-path in gpu
	// var material   = new THREE.MeshBasicMaterial();
	// material.color.set('black')
	// material.opacity   = 0;
	// material.blending  = THREE.NoBlending;
	
	// cache the material
	THREEx.Portal360.buildTransparentMaterial.material = material
	
	return material		
}

//////////////////////////////////////////////////////////////////////////////
//		Build various cache
//////////////////////////////////////////////////////////////////////////////
THREEx.Portal360.buildSquareCache = function(){
	var container = new THREE.Group
	// add outter cube - invisibility cloak
	var geometry = new THREE.PlaneGeometry(50,50);
	var material = THREEx.Portal360.buildTransparentMaterial()

	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x =  geometry.parameters.width/2 + 0.5
	mesh.position.y = -geometry.parameters.height/2 + 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = -geometry.parameters.width/2 + 0.5
	mesh.position.y = -geometry.parameters.height/2 - 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = -geometry.parameters.width/2 - 0.5
	mesh.position.y =  geometry.parameters.height/2 - 0.5
	container.add(mesh)
	
	var mesh = new THREE.Mesh( geometry, material);
	mesh.position.x = +geometry.parameters.width/2 - 0.5
	mesh.position.y =  geometry.parameters.height/2 + 0.5
	container.add(mesh)

	return container
}

//////////////////////////////////////////////////////////////////////////////
//		build meshes
//////////////////////////////////////////////////////////////////////////////

/**
 * create insideMesh which is visible IIF inside the portal
 */
THREEx.Portal360.prototype._buildInsideMesh	= function(texture360, doorWidth, doorHeight){
	var doorInsideCenter = new THREE.Group

	// var squareCache = THREEx.Portal360.buildSquareCache()
	// squareCache.scale.y = doorWidth
	// squareCache.scale.y = doorHeight
	// doorInsideCenter.add( squareCache )

	var geometry = new THREE.PlaneGeometry(doorWidth, doorHeight)
	var material = THREEx.Portal360.buildTransparentMaterial()
	// var material = new THREE.MeshNormalMaterial()
	var mesh = new THREE.Mesh( geometry, material)
	mesh.rotation.y = Math.PI
	// mesh.position.z = 0.03
	doorInsideCenter.add( mesh )


	//////////////////////////////////////////////////////////////////////////////
	//		add 360 sphere
	//////////////////////////////////////////////////////////////////////////////
	// add 360 texture
	// TODO put that in a this.data
	var radius360Sphere = 10
	// var radius360Sphere = 1

	var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16).rotateZ(Math.PI)
	var material = new THREE.MeshBasicMaterial( {
		map: texture360,
		// opacity: 0.9,
		side: THREE.DoubleSide,
	});
	// var material = new THREE.MeshNormalMaterial()
	var sphere360Mesh = new THREE.Mesh( geometry, material );
	sphere360Mesh.position.z = -0.1
	sphere360Mesh.rotation.y = Math.PI
	doorInsideCenter.add(sphere360Mesh)
	
	return doorInsideCenter
}

/**
 * create outsideMesh which is visible IIF outside the portal
 */
THREEx.Portal360.prototype._buildOutsideMesh = function(texture360, doorWidth, doorHeight){
	var doorOutsideCenter = new THREE.Group

	//////////////////////////////////////////////////////////////////////////////
	//		add squareCache
	//////////////////////////////////////////////////////////////////////////////
	var squareCache = THREEx.Portal360.buildSquareCache()
	squareCache.scale.y = doorWidth
	squareCache.scale.y = doorHeight
	doorOutsideCenter.add( squareCache )

	//////////////////////////////////////////////////////////////////////////////
	//		add 360 sphere
	//////////////////////////////////////////////////////////////////////////////
	// add 360 texture
	var radius360Sphere = 10
	// var radius360Sphere = 1

	// build half sphere geometry
	var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16, Math.PI, Math.PI, 0, Math.PI).rotateZ(Math.PI)
	// fix UVs
	geometry.faceVertexUvs[0].forEach(function(faceUvs){
		faceUvs.forEach(function(uv){
			uv.x /= 2
		})
	})
	geometry.uvsNeedUpdate = true
	var material = new THREE.MeshBasicMaterial( {
		map: texture360,
		// opacity: 0.9,
		side: THREE.BackSide,
	});
	// var geometry = new THREE.SphereGeometry( radius360Sphere, 16, 16);
	// var material = new THREE.MeshNormalMaterial()
	var sphere360Mesh = new THREE.Mesh( geometry, material );
	sphere360Mesh.position.z = -0.1
	doorOutsideCenter.add(sphere360Mesh)
	
	return doorOutsideCenter
}

/**
 * create frameMesh for the frame of the portal
 */
THREEx.Portal360.prototype._buildRectangularFrame = function(radius, width, height){
	var container = new THREE.Group
	var material = new THREE.MeshNormalMaterial()
	var material = new THREE.MeshPhongMaterial({
		color: 'silver',
		emissive: 'green'
	})

	var geometryBeamVertical = new THREE.CylinderGeometry(radius, radius, height - radius)

	// mesh right
	var meshRight = new THREE.Mesh(geometryBeamVertical, material)
	meshRight.position.x = width/2
	container.add(meshRight)

	// mesh right
	var meshLeft = new THREE.Mesh(geometryBeamVertical, material)
	meshLeft.position.x = -width/2
	container.add(meshLeft)

	var geometryBeamHorizontal = new THREE.CylinderGeometry(radius, radius, width - radius).rotateZ(Math.PI/2)

	// mesh top
	var meshTop = new THREE.Mesh(geometryBeamHorizontal, material)
	meshTop.position.y = height/2
	container.add(meshTop)

	// mesh bottom
	var meshBottom = new THREE.Mesh(geometryBeamHorizontal, material)
	meshBottom.position.y = -height/2
	container.add(meshBottom)

	return container
}	

//////////////////////////////////////////////////////////////////////////////
//	                         	update function
//////////////////////////////////////////////////////////////////////////////

THREEx.Portal360.prototype.changeUpdateFunctionTo2 = function ()
{

	this.PortalScene = scene;
	//scene = new THREE.Scene();
	this.n = 100;
	this.k = 0;
	this.camera = camera;
	//this.controls = new THREE.DeviceOrientationControls(this.camera);
	
	this.px = -this.PortalScene.position.x / this.n;
	this.py = -this.PortalScene.position.y / this.n;

	this.rx = -(this.PortalScene.rotation.x-Math.PI/2)/this.n;
	this.ry = -this.PortalScene.rotation.y/this.n;	
	this.rz = -this.PortalScene.rotation.z/this.n;
	this.update = this.update2;
};

THREEx.Portal360.prototype.changeUpdateFunctionTo3 = function ()
{
	this.AntiVec = this.PortalScene.position.clone();
	this.AntiVec.normalize();
	this.AntiVec.multiplyScalar(-0.3);	
	this.update = this.update3;
};

THREEx.Portal360.prototype.changeUpdateFunctionTo4 = function ()
{
	this.update = this.update4;
};

THREEx.Portal360.prototype.update1 = function () {
	// determine if the user is isOutsidePortal
	var localPosition = new THREE.Vector3();
	this.object3d.worldToLocal(localPosition)
	var isOutsidePortal = localPosition.z >= 0 ? true : false
}


THREEx.Portal360.prototype.update2 = function() 
{
	this.PortalScene.position.x+=this.px;
	this.PortalScene.position.y+=this.py;

	this.PortalScene.rotation.x+=this.rx;
	this.PortalScene.rotation.y+=this.ry;
	this.PortalScene.rotation.z+=this.rz;

	this.k++;
	if (this.k===this.n)
		this.changeUpdateFunctionTo3();

};

THREEx.Portal360.prototype.update3 = function() 
{
	if (this.PortalScene.position.z < 4)
		this.PortalScene.position.add(this.AntiVec);	
		else
		{	
			this.changeUpdateFunctionTo4();
		}
};

THREEx.Portal360.prototype.update4 = function() 
{
	this.controls.update();

};
