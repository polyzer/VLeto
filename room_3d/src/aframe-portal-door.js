//////////////////////////////////////////////////////////////////////////////
//		arjs-hit-testing
//////////////////////////////////////////////////////////////////////////////
var PortalDoor = null;

AFRAME.registerComponent('arjs-portal-door', {
	schema: {
		url : {		// Url of the content - may be video or image
			type: 'string',
		},
		doorWidth : {	// width of the door
			type: 'number',
			default: 1,
		},
		doorHeight : {	// height of the door
			type: 'number',
			default: 2,
		},
	},
	init: function () {
		var _this = this

		var doorWidth = this.data.doorWidth
		var doorHeight = this.data.doorHeight
		var imageURL = this.data.url

		this._portalDoor = new THREEx.Portal360(imageURL, doorWidth, doorHeight);
		PortalDoor = this._portalDoor;

		if(window.DeviceOrientationEvent)
		{
			window.addEventListener("deviceorientation", this._portalDoor);
		}

		this.el.object3D.add(this._portalDoor.object3d)
	},
	tick: function(){
		this._portalDoor.update()


		if(CameraInfoDiv)
			//if(APortalDoor)
			if(AAnchor)
				CameraInfoDiv.innerText = AAnchor.object3D.position.x + " " + AAnchor.object3D.position.y + " " + AAnchor.object3D.position.z;

		// if(globalFuncsArray)
		// 	globalFuncsArray.forEach(function (arr_el) {
		// 		arr_el();
		// 	});
	}
})


AFRAME.registerPrimitive('a-portal-door', AFRAME.utils.extendDeep({}, AFRAME.primitives.getMeshMixin(), {
	defaultComponents: {
		'arjs-portal-door': {},
	},
	mappings: {
		'url': 'arjs-portal-door.url',
	}
}))
