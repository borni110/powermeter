var pause_osc = true;
var connect = false;
var counter = 10;
var savecounter = 0;

var connection = new WebSocket('ws://' + location.hostname + '/ws', ['arduino']);

setInterval(function () { if ( connect == true ) getStatus();}, 1000);

connection.onopen = function () {
	connect = true; 	
//	console.log('STA');
	connection.send('STA');
};

connection.onerror = function (error) {
	connect = false; 
	console.log('WebSocket Error ', error);
	connection = new WebSocket('ws://' + location.hostname + '/ws', ['arduino']); 
};

connection.onmessage = function (e) {
//	console.log('Server: ', e.data);
	partsarry = e.data.split('\\');
	if (partsarry[0] == 'OScopeProbe') {
		GotOScope(e.data );
	}
	else if (partsarry[0] == 'status') {
		if ( partsarry[1] == 'Save' ) {
			document.getElementById('fixedfooter').style.background = "#008000";
			document.getElementById('status').firstChild.nodeValue = "settings saved";
			savecounter = 2;
		}
		else {
			if ( savecounter < 0 ) document.getElementById('status').firstChild.nodeValue = partsarry[1];
			counter = 5;
		}
	}
	else {
		if ( document.getElementById( partsarry[0] ) ) { document.getElementById( partsarry[0] ).value = partsarry[1]; refreshOpcode(); }
	}
}

function refreshValue() {
//	console.log( "send: SAV" );
	if ( connect ) connection.send( "SAV" );
//	console.log('send: STA');
	if ( connect ) connection.send('STA');
}

function getStatus() {
//	console.log('send: STS');
	if ( connect ) connection.send('STS');
	counter = counter - 1;
	savecounter = savecounter -1;
	if ( counter < 1 && savecounter < 0 ) {
		if ( document.getElementById( 'status' ) ) { 
			document.getElementById('fixedfooter').style.background = "#800000";
			document.getElementById( 'status' ).firstChild.nodeValue = 'offline';
		}
	}
	if ( savecounter < 0 ) {
		document.getElementById('fixedfooter').style.background = "#333333";
	}
}

function refreshOpcode() {
  var data = document.getElementById( 'CHO' ).value;
  var opcode = data.substr( 0, 1);
  document.getElementById( 'opcode_0' ).value = opcode;
  var opcode = data.substr( 2, 1);
  document.getElementById( 'opcode_1' ).value = opcode;
  var opcode = data.substr( 4, 1);
  document.getElementById( 'opcode_2' ).value = opcode;
  var opcode = data.substr( 6, 1);
  document.getElementById( 'opcode_3' ).value = opcode;
  var opcode = data.substr( 8, 1);
  document.getElementById( 'opcode_4' ).value = opcode;
  var opcode = data.substr( 10, 1);
  document.getElementById( 'opcode_5' ).value = opcode;
  var opcode = data.substr( 12, 1);
  document.getElementById( 'opcode_6' ).value = opcode;
  var opcode = data.substr( 14, 1);
  document.getElementById( 'opcode_7' ).value = opcode;

  var channel = data.substr( 1, 1);
  document.getElementById( 'channel_0' ).value = channel;
  var channel = data.substr( 3, 1);
  document.getElementById( 'channel_1' ).value = channel;
  var channel = data.substr( 5, 1);
  document.getElementById( 'channel_2' ).value = channel;
  var channel = data.substr( 7, 1);
  document.getElementById( 'channel_3' ).value = channel;
  var channel = data.substr( 9, 1);
  document.getElementById( 'channel_4' ).value = channel;
  var channel = data.substr( 11, 1);
  document.getElementById( 'channel_5' ).value = channel;
  var channel = data.substr( 13, 1);
  document.getElementById( 'channel_6' ).value = channel;
  var channel = data.substr( 15, 1);
  document.getElementById( 'channel_7' ).value = channel;
}

function refreshOpcodeStr() {
  var opcode_str = '';
  opcode_str += document.getElementById( 'opcode_0' ).value;
  opcode_str += document.getElementById( 'channel_0' ).value;
  opcode_str += document.getElementById( 'opcode_1' ).value;
  opcode_str += document.getElementById( 'channel_1' ).value;
  opcode_str += document.getElementById( 'opcode_2' ).value;
  opcode_str += document.getElementById( 'channel_2' ).value;
  opcode_str += document.getElementById( 'opcode_3' ).value;
  opcode_str += document.getElementById( 'channel_3' ).value;
  opcode_str += document.getElementById( 'opcode_4' ).value;
  opcode_str += document.getElementById( 'channel_4' ).value;
  opcode_str += document.getElementById( 'opcode_5' ).value;
  opcode_str += document.getElementById( 'channel_5' ).value;
  opcode_str += document.getElementById( 'opcode_6' ).value;
  opcode_str += document.getElementById( 'channel_6' ).value;
  opcode_str += document.getElementById( 'opcode_7' ).value;
  opcode_str += document.getElementById( 'channel_7' ).value;
  document.getElementById( 'CHO' ).value = opcode_str;
  console.log( opcode_str );
}

function SaveSetting( value ) {
//	console.log( "send: " + value  + "\\" + document.getElementById( value ).value );
	if ( connect ) connection.send( value + "\\" + document.getElementById( value ).value );
}

function OScopeProbe() {
//	console.log( "send: OSC" );
	if ( connect ) connection.send( "OSC" );
}

function GotOScope(data)
{
	var mult = Number(document.getElementById('OSCMultIn').value);
	document.getElementById('OSCMultOut').innerHTML = mult;

	var ocanvas = document.getElementById('OScopeCanvas');
	var otx = ocanvas.getContext('2d');
	var fcanvas = document.getElementById('FFTCanvas');
	var ftx = fcanvas.getContext('2d');

	if( otx.canvas.width != ocanvas.clientWidth )   otx.canvas.width = ocanvas.clientWidth;
	if( otx.canvas.height != ocanvas.clientHeight ) otx.canvas.height = ocanvas.clientHeight;

	if( ftx.canvas.width != fcanvas.clientWidth )   ftx.canvas.width = fcanvas.clientWidth;
	if( ftx.canvas.height != fcanvas.clientHeight ) ftx.canvas.height = fcanvas.clientHeight;

	var secs = data.split( "\\" );

	var channels = Number( secs[1] );
	var samps = Number( secs[2] );
	var fftsamps = secs[3];
	var iratio = ocanvas.clientHeight / ( secs[4]*4096 ) * 10;
	var data = secs[5];
	var fftdata = secs[6];

	otx.clearRect(0, 0, ocanvas.width, ocanvas.height);
	
	for( var round=0 ; round < channels ; round++ )
	{
		if ( round == 0 && !document.getElementById("channel0").checked ) continue;
		if ( round == 1 && !document.getElementById("channel1").checked ) continue;
		if ( round == 2 && !document.getElementById("channel2").checked ) continue;
		if ( round == 3 && !document.getElementById("channel3").checked ) continue;
		if ( round == 4 && !document.getElementById("channel4").checked ) continue;
		if ( round == 5 && !document.getElementById("channel5").checked ) continue;
		if ( round == 6 && !document.getElementById("channelv").checked ) continue;

		otx.beginPath();
		if ( round == 0 ) otx.strokeStyle = "#ff0000";
		if ( round == 2 ) otx.strokeStyle = "#c00000";
		if ( round == 4 ) otx.strokeStyle = "#800000";
		if ( round == 1 ) otx.strokeStyle = "#0000FF";
		if ( round == 3 ) otx.strokeStyle = "#0000c0";
		if ( round == 5 ) otx.strokeStyle = "#000080";
		if ( round == 6 ) otx.strokeStyle = "#400000";

		var lastsamp = parseInt( data.substr( samps * round ,3),16 );

		for (var i = samps * round ; i < samps * round + samps ; i++)
		{
			var x2 = ((i-(samps * round)) ) * ocanvas.clientWidth / ( samps - 1 );
			var samp = parseInt(data.substr(i * 3, 3), 16);
			var y2 = ( 1.-mult*samp / 4096 ) * ocanvas.clientHeight ;
			
			if( i == 0 )
			{
				var x1 = i * ocanvas.clientWidth / samps;
				var y1 = ( 1.-mult*lastsamp / 4096 ) * ocanvas.clientHeight ;
				otx.moveTo( x1, y1 + ( ( mult * ocanvas.clientHeight ) / 2 ) - ( ocanvas.clientHeight / 2 ) );
			}

			otx.lineTo( x2, y2  + ( ( mult * ocanvas.clientHeight ) / 2 ) - ( ocanvas.clientHeight / 2 ) );

			lastsamp = samp;
		}
		otx.stroke();
	}

	ftx.clearRect(0, 0, fcanvas.width, fcanvas.height);
	
	for( var round=0 ; round < channels ; round++ )
	{
		if ( round == 0 && !document.getElementById("channel0").checked ) continue;
		if ( round == 1 && !document.getElementById("channel1").checked ) continue;
		if ( round == 2 && !document.getElementById("channel2").checked ) continue;
		if ( round == 3 && !document.getElementById("channel3").checked ) continue;
		if ( round == 4 && !document.getElementById("channel4").checked ) continue;
		if ( round == 5 && !document.getElementById("channel5").checked ) continue;
		if ( round == 6 && !document.getElementById("channelv").checked ) continue;


		ftx.beginPath();
		if ( round == 0 ) ftx.strokeStyle = "#ff0000";
		if ( round == 2 ) ftx.strokeStyle = "#c00000";
		if ( round == 4 ) ftx.strokeStyle = "#800000";
		if ( round == 1 ) ftx.strokeStyle = "#0000FF";
		if ( round == 3 ) ftx.strokeStyle = "#0000c0";
		if ( round == 5 ) ftx.strokeStyle = "#000080";
		if ( round == 6 ) ftx.strokeStyle = "#400000";


		var lastsamp = parseInt( fftdata.substr( fftsamps * round ,3),16 ) * mult;

		var x1 = 0;
		var y1 = 0;

		for (var i = fftsamps * round ; i < fftsamps * round + fftsamps ; i++)
		{
			var x2 = ((i-(fftsamps * round)) ) * fcanvas.clientWidth / ( fftsamps - 1 );
			var samp = parseInt(fftdata.substr(i * 3, 3), 16) * mult;
			var y2 = ( 1.-samp / 1024 ) * fcanvas.clientHeight - 1;
			
			ftx.moveTo( x1, y1 );
      ftx.bezierCurveTo( x2, y1, x1, y2, x2, y2 );
      x1 = x2;
      y1 = y2;
//			ftx.lineTo( x2, y2 );

			lastsamp = samp;
		}
		ftx.stroke();
	}
	
	ftx.beginPath();
	ftx.strokeStyle = "#000000";
  ftx.font = "30px Arial";
  ftx.fillText("Spectrum",10,30);
  ftx.stroke();


	ftx.beginPath();
	ftx.strokeStyle = "#c0c0c0";
	for (i = 1; (iratio * mult * i) < ( fcanvas.clientHeight ); i++)
	{
		ftx.moveTo(0, fcanvas.clientHeight - (iratio * mult * i) );
		ftx.lineTo( ftx.canvas.width, fcanvas.clientHeight - (iratio * mult * i) );
	}
	ftx.stroke();
	ftx.beginPath();
	
	ftx.strokeStyle = "#000000";
	ftx.strokeRect( 0,  0, fcanvas.clientWidth, fcanvas.clientHeight );
	ftx.stroke();
	
	otx.beginPath();
	otx.strokeStyle = "#c0c0c0";

  for (i = 1; (iratio * mult * i) < ( ocanvas.clientHeight / 2); i++)
	{
		otx.moveTo(0, ocanvas.clientHeight / 2 + (iratio * mult * i));
		otx.lineTo(otx.canvas.width, ocanvas.clientHeight / 2 + (iratio * mult * i));
		otx.moveTo(0, ocanvas.clientHeight / 2 - (iratio * mult * i));
		otx.lineTo(otx.canvas.width, ocanvas.clientHeight / 2 - (iratio * mult * i));
	}

	otx.stroke();
	otx.beginPath();
	
	otx.strokeStyle = "#c0c0c0";
	otx.moveTo(0, ocanvas.clientHeight / 2);
	otx.lineTo(ocanvas.clientWidth, ocanvas.clientHeight / 2);

	otx.moveTo(1, ocanvas.clientHeight / 2 - 20 );
	otx.lineTo(1, ocanvas.clientHeight / 2 + 20);

	otx.moveTo(otx.canvas.width / 8, ocanvas.clientHeight / 2 - 10);
	otx.lineTo(otx.canvas.width / 8 , ocanvas.clientHeight / 2 + 10);

	otx.moveTo(otx.canvas.width / 8 * 2, ocanvas.clientHeight / 2 - 10 );
	otx.lineTo(otx.canvas.width / 8 * 2, ocanvas.clientHeight / 2 + 10);

	otx.moveTo(otx.canvas.width / 8 * 3, ocanvas.clientHeight / 2 - 10 );
	otx.lineTo(otx.canvas.width / 8 * 3, ocanvas.clientHeight / 2 + 10);

	otx.moveTo(otx.canvas.width / 2, ocanvas.clientHeight / 2 - 20);
	otx.lineTo(otx.canvas.width / 2 , ocanvas.clientHeight / 2 + 20);

	otx.moveTo(otx.canvas.width / 8 * 5, ocanvas.clientHeight / 2 - 10 );
	otx.lineTo(otx.canvas.width / 8 * 5, ocanvas.clientHeight / 2 + 10);

	otx.moveTo(otx.canvas.width / 8 * 6, ocanvas.clientHeight / 2 - 10);
	otx.lineTo(otx.canvas.width / 8 * 6, ocanvas.clientHeight / 2 + 10);

	otx.moveTo(otx.canvas.width / 8 * 7, ocanvas.clientHeight / 2 - 10);
	otx.lineTo(otx.canvas.width / 8 * 7, ocanvas.clientHeight / 2 + 10);

	otx.moveTo(otx.canvas.width - 1, ocanvas.clientHeight / 2 - 20 );
	otx.lineTo(otx.canvas.width - 1, ocanvas.clientHeight / 2 + 20);

	otx.strokeStyle = "#000000";
	otx.strokeRect( 0,  0, ocanvas.clientWidth, ocanvas.clientHeight );

	otx.stroke();

  otx.beginPath();
	otx.fillStyle = "#bF0000";
  otx.fillRect(10,60, 10,10);
  otx.font = "15px Arial";
  otx.fillText("current",30,70);
  otx.stroke();

  otx.beginPath();
	otx.fillStyle = "#0000bF";
  otx.fillRect(10,80, 10,10);
  otx.font = "15px Arial";
  otx.fillText("voltage",30,90);
  otx.stroke();

  otx.beginPath();
	otx.fillStyle = "#000000";
  otx.font = "30px Arial";
  otx.fillText("Oscilloscope",10,30);
  otx.font = "15px Arial";
  otx.fillText("div: 5 or 4.17ms / 10A",10,50);
  otx.stroke();
  
	if (!pause_osc)
		OScopeProbe();
}

function ToggleOScopePause()
{
	pause_osc = !pause_osc;
}

function PhaseshiftPlus()
{
	if ( connect ) connection.send( "PS+" );	
}

function PhaseshiftMinus()
{
	if ( connect ) connection.send( "PS-" );		
}

function SampleratePlus()
{
	if ( connect ) connection.send( "FQ+" );	
}

function SamplerateMinus()
{
	if ( connect ) connection.send( "FQ-" );		
}

