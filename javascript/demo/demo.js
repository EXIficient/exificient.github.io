/**
 * Demo functions
 */


function writeUint18ArrayBufferToEXIEditor(uint8Array, uint8ArrayLength) {
	var hex = "";
	for(var i=0; i<uint8ArrayLength; i++) {
		var sh = uint8Array[i].toString(16); // base 16 (hex)
		if(sh.length == 1) {
			sh = "0" + sh;
		}
		// hex +=	"0x" + sh + " ";
		hex +=	sh + " ";			
		if((i+1) % 16 == 0) {
			hex += "\n"
		}
	}
	// editorEXI.setValue("len = " + uint8ArrayLength + "\n" + hex);
	editorEXI.setValue(hex);
}

function pieChart(percentage, size, color) {
    var svgns = "http://www.w3.org/2000/svg";
    var chart = document.createElementNS(svgns, "svg:svg");
    chart.setAttribute("width", size);
    chart.setAttribute("height", size);
    chart.setAttribute("viewBox", "0 0 " + size + " " + size);
    // Background circle
    var back = document.createElementNS(svgns, "circle");
    back.setAttributeNS(null, "cx", size / 2);
    back.setAttributeNS(null, "cy", size / 2);
    back.setAttributeNS(null, "r",  size / 2);
    var color = "#d0d0d0";
    if (size > 50) { 
        color = "#ebebeb";
    }
    back.setAttributeNS(null, "fill", color);
    chart.appendChild(back);
    // primary wedge
    var path = document.createElementNS(svgns, "path");
    var unit = (Math.PI *2) / 100;    
    var startangle = 0;
    var endangle = percentage * unit - 0.001;
    var x1 = (size / 2) + (size / 2) * Math.sin(startangle);
    var y1 = (size / 2) - (size / 2) * Math.cos(startangle);
    var x2 = (size / 2) + (size / 2) * Math.sin(endangle);
    var y2 = (size / 2) - (size / 2) * Math.cos(endangle);
    var big = 0;
    if (endangle - startangle > Math.PI) {
        big = 1;
    }
    var d = "M " + (size / 2) + "," + (size / 2) +  // Start at circle center
        " L " + x1 + "," + y1 +     // Draw line to (x1,y1)
        " A " + (size / 2) + "," + (size / 2) +       // Draw an arc of radius r
        " 0 " + big + " 1 " +       // Arc details...
        x2 + "," + y2 +             // Arc goes to to (x2,y2)
        " Z";                       // Close path back to (cx,cy)
    path.setAttribute("d", d); // Set this path 
    path.setAttribute("fill", '#f05f3b');
    chart.appendChild(path); // Add wedge to chart
    // foreground circle
    var front = document.createElementNS(svgns, "circle");
    front.setAttributeNS(null, "cx", (size / 2));
    front.setAttributeNS(null, "cy", (size / 2));
    front.setAttributeNS(null, "r",  (size * 0.17)); //about 34% as big as back circle 
    front.setAttributeNS(null, "fill", "#fff");
    chart.appendChild(front);
    return chart;
}

function switchOptionsOnOff() {
	var id = "myOptionsRow";
	if( document.getElementById(id).style.display == 'none') {
		document.getElementById(id).style.display=''; // block 
	} else {
		// alert("'" + document.getElementById(id).style.display + "'");
		document.getElementById(id).style.display='none'; 
	}
	// document.getElementById(id).style.display='none';
	// document.getElementById(id).style.display='block';  
}


// parse URL parameters
function gup( name, url ) {
  if (!url) url = location.href;
  name = name.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
  var regexS = "[\\?&]"+name+"=([^&#]*)";
  var regex = new RegExp( regexS );
  var results = regex.exec( url );
  return results == null ? null : results[1];
}