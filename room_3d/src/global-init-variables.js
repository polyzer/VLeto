var global_init_variables = function ()
{
    this.init();
};

global_init_variables.prototype.init = function (){               
	this.cameraDom = document.querySelector("#StaticCamera");
	this.APortalDoor = document.querySelector("#APortalDoor");
	this.AAnchor = document.querySelector("#AAnchor");
	this.GlobalScene = document.querySelector("#GlobalScene");

	this.CameraInfoDiv = document.createElement("div");
	this.CameraInfoDiv.setAttribute("id", "CameraInfoDiv");
	document.body.appendChild(this.CameraInfoDiv);
	this.CameraInfoDiv.style.position = "absolute";
	this.CameraInfoDiv.style.left = "100px";
	this.CameraInfoDiv.style.top = "100px";
	this.CameraInfoDiv.style.zIndex = "100000000";
	
};