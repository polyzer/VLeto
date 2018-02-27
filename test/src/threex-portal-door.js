var THREEx = THREEx || {}

THREEx.Portal360 = function(videoImageURL, doorWidth, doorHeight, radius){
	
	this.update1 = this.update1.bind(this);
	this.update2 = this.update2.bind(this);
	this.update3 = this.update3.bind(this);
	this.update4 = this.update4.bind(this);
	this.update5 = this.update5.bind(this);
			/// 
	this.deviceMotionInterval = 0;
	this.dt = 0.015;
	this.phi = Math.PI/2;
	this.theta = Math.PI/2;

	this.target = new THREE.Vector3();	
	radius *= 5; /*
	doorWidth *= 5;
	doorHeight *= 5;*/
	this.radius = radius;

	this.update = this.update1;

	var doorCenter = new THREE.Group;
	doorCenter.position.y = doorHeight/2;
	this.object3d = doorCenter;

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
	var insideMesh = this._buildInsideMesh(texture360, doorWidth, doorHeight, radius)
	insideMesh.name = "inside"
	doorCenter.add(insideMesh)
	this.insideMesh = insideMesh

	// create outsideMesh which is visible IIF outside the portal
	var outsideMesh = this._buildOutsideMesh(texture360, doorWidth, doorHeight, radius)
	insideMesh.name = "outside"
	doorCenter.add(outsideMesh)
	this.outsideMesh = outsideMesh

	// create frameMesh for the frame of the portal
	var frameMesh = this._buildRectangularFrame(doorWidth/100, doorWidth, doorHeight)
	frameMesh.name = "frame"
	// // it adds glow Effect to portal.

	doorCenter.add(frameMesh);
//	doorCenter.add(glowMesh);

	this.doorCenter = doorCenter;
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
THREEx.Portal360.prototype._buildInsideMesh	= function(texture360, doorWidth, doorHeight, radius){
	var doorInsideCenter = new THREE.Group

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
	var radius360Sphere = radius
	// var radius360Sphere = 1

	var geometry = new THREE.SphereGeometry( radius360Sphere, 100, 100).rotateZ(Math.PI)
	var material = new THREE.MeshBasicMaterial( {
		map: texture360,
		// opacity: 0.9,
		side: THREE.DoubleSide,
	});
	// var material = new THREE.MeshNormalMaterial()
	var sphere360Mesh = new THREE.Mesh( geometry, material );
	sphere360Mesh.position.z = -radius360Sphere*0.01
	sphere360Mesh.rotation.y = Math.PI
	doorInsideCenter.add(sphere360Mesh)
	
	return doorInsideCenter
}

/**
 * create outsideMesh which is visible IIF outside the portal
 */
THREEx.Portal360.prototype._buildOutsideMesh = function(texture360, doorWidth, doorHeight, radius){
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
	var radius360Sphere = radius;

	var geometry = new THREE.SphereGeometry( radius360Sphere, 100, 100, Math.PI, Math.PI, 0, Math.PI).rotateZ(Math.PI)
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
	var sphere360Mesh = new THREE.Mesh( geometry, material );
	sphere360Mesh.position.z = -radius360Sphere*0.01
	doorOutsideCenter.add(sphere360Mesh)
	
	return doorOutsideCenter
}

/**
 * create frameMesh for the frame of the portal
 */
THREEx.Portal360.prototype._buildRectangularFrame = function(radius, width, height){
	var container = new THREE.Group();
	var material = new THREE.MeshNormalMaterial();
	var material = new THREE.MeshPhongMaterial({
		color: 'silver',
		emissive: 'green'
	});

	var spriteMap = new THREE.TextureLoader().load( 'images/textures/disturb.jpg' );
	var spriteMaterial = new THREE.SpriteMaterial( { map: spriteMap} );
	var sprite = new THREE.Sprite( spriteMaterial );
	sprite.scale.set(width*1.2, height*1.2, 1);
	// sprite.position.set(0,0,-1);
	 container.add(sprite);

	var SpriteContainerMesh = new THREE.Object3D();
	SpriteContainerMesh.add(sprite);

	container.add(SpriteContainerMesh);


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

	this.PortalScene = AAnchor.object3D;
	AAnchor.object3D = new THREE.Scene();
	this.n = 100;
	this.k = 0;
	this.camera = cameraDom.object3D;
	// accelerometer orientation controller
	this.controls = new THREE.DeviceOrientationControls(this.camera);
	//mouse/touch controller
	this.hammer = new Hammer(document.body);
	this.hammer.get('pan').set({ direction: Hammer.DIRECTION_ALL });
	this.hammer.on("pan", function (event) {
		this.camera.rotation.y -= THREE.Math.degToRad(event.deltaX/20);
		this.camera.rotation.x -= THREE.Math.degToRad(event.deltaY/20);
	}.bind(this));

	OrientationParameters.x = this.PortalScene.rotation.x
	OrientationParameters.y = this.PortalScene.rotation.y
	OrientationParameters.z = this.PortalScene.rotation.z

	this.px = -this.PortalScene.position.x / this.n;
	this.py = -this.PortalScene.position.y / this.n;

	/*if (this.PortalScene.rotation.x>Math.PI/2)
		this.rx = -(this.PortalScene.rotation.x-Math.PI/2)/this.n;
	else
		this.rx = (this.PortalScene.rotation.x+Math.PI/2)/this.n;*/


	this.rx = -(this.PortalScene.rotation.x-Math.PI/2)/this.n;
	
	//this.ry = -this.PortalScene.rotation.y/this.n;	
	if (this.PortalScene.rotation.y > 0)
		this.ry = -this.PortalScene.rotation.y/this.n;
	else
		this.ry  = this.PortalScene.rotation.y/this.n;
	
	if (this.PortalScene.rotation.z > 0)
		this.rz = -this.PortalScene.rotation.z/this.n;
	else
		this.rz = this.PortalScene.rotation.z/this.n;
	this.update = this.update2;
};

THREEx.Portal360.prototype.changeUpdateFunctionTo3 = function ()
{
	this.update = this.update3;
};


THREEx.Portal360.prototype.changeUpdateFunctionTo4 = function ()
{
	this.AntiVec = this.PortalScene.position.clone();
	this.AntiVec.normalize();
	this.AntiVec.multiplyScalar(-0.3);	
	this.update = this.update4;
};

THREEx.Portal360.prototype.update1 = function (now, delta) {
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
		this.changeUpdateFunctionTo4();

};

THREEx.Portal360.prototype.update3 = function() 
{	

};

THREEx.Portal360.prototype.update4 = function() 
{
	if (this.PortalScene.position.z < 4)
		this.PortalScene.position.add(this.AntiVec);	
		else
		{	
			this.update = this.update5;
		}
};

THREEx.Portal360.prototype.update5 = function() 
{
	if(ControlParameters.Type === CONTROL_PARAMETERS.TYPE.ACCELEROMETER){
		if(ControlParameters.Clicked === true)
		{
			ControlParameters.Clicked = false;
			this.hammer.enable = false;			
		}

		this.controls.update();
	}
	else {
		if(ControlParameters.Clicked === true)
		{
			ControlParameters.Clicked = false;
			this.hammer.enable = true;
		}
	}
};


THREEx.Portal360.prototype.onOrientationEvent = function (event)
{

};

THREEx.Portal360.prototype.onAccelerationEvent = function (event)
{

};
