// bevel_keyframes.jsx
// Loops altitude from START_ALT to END_ALT, setting a keyframe on the
// Bevel & Emboss effect at each step, advancing the timeline by FRAME_DURATION.
//
// HOW TO USE:
//   1. Open your logo PSD in Photoshop.
//   2. Make sure the Timeline panel is open and a video timeline exists.
//   3. Set the layer name below to match your logo layer.
//   4. File → Scripts → Browse → select this file.

// ── CONFIG ──────────────────────────────────────────────────────────────────
var LAYER_NAME     = "Text";   // name of the layer with Bevel & Emboss
var START_ALT      = 1;        // starting altitude (degrees)
var END_ALT        = 90;       // ending altitude (degrees)
var FRAME_DURATION = 1;        // frames between each keyframe
var START_FRAME    = 0;        // timeline frame to begin on
var FRAME_RATE     = 30;       // must match your timeline fps (check Timeline panel)
// ────────────────────────────────────────────────────────────────────────────

var doc = app.activeDocument;

// Recursively search all layers and groups for the target layer name
function findLayerRecursive(layers, name) {
    for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        if (l.name === name) return l;
        if (l.layers && l.layers.length > 0) {
            var found = findLayerRecursive(l.layers, name);
            if (found) return found;
        }
    }
    return null;
}

var targetLayer = findLayerRecursive(doc.layers, LAYER_NAME);

if (!targetLayer) {
    // List all layer names to help diagnose
    var allNames = [];
    function collectNames(layers) {
        for (var i = 0; i < layers.length; i++) {
            allNames.push(layers[i].name);
            if (layers[i].layers) collectNames(layers[i].layers);
        }
    }
    collectNames(doc.layers);
    alert("Layer '" + LAYER_NAME + "' not found.\n\nAll layers found:\n" + allNames.join("\n"));
}

// Helper: set Bevel & Emboss altitude via Action Descriptors
// (the scripting DOM doesn't expose layer effect properties directly)
function setBevelAltitude(layer, altitude) {
    var idsetd = charIDToTypeID("setd");
    var desc1  = new ActionDescriptor();

    var idnull = charIDToTypeID("null");
    var ref1   = new ActionReference();
    ref1.putEnumerated(
        charIDToTypeID("Lyr "),
        charIDToTypeID("Ordn"),
        charIDToTypeID("Trgt")
    );
    desc1.putReference(idnull, ref1);

    var idT    = charIDToTypeID("T   ");
    var desc2  = new ActionDescriptor();

    var idfxsl = stringIDToTypeID("layerEffects");
    var desc3  = new ActionDescriptor();

    var idbvem = stringIDToTypeID("bevelEmboss");
    var desc4  = new ActionDescriptor();

    // Altitude
    var idlocalLightingAltitude = stringIDToTypeID("localLightingAltitude");
    desc4.putUnitDouble(idlocalLightingAltitude, charIDToTypeID("#Ang"), altitude);

    // Keep Use Global Light OFF so the value actually sticks
    var idUGLi = stringIDToTypeID("useGlobalLight");
    desc4.putBoolean(idUGLi, false);

    desc3.putObject(idbvem, idbvem, desc4);
    desc2.putObject(idfxsl, idfxsl, desc3);
    desc1.putObject(idT, charIDToTypeID("Lyr "), desc2);

    executeAction(idsetd, desc1, DialogModes.NO);
}

// Helper: move timeline to a specific frame and insert a keyframe
// on the "Style" (layer effects) property of the current layer
function setKeyframeAtFrame(frameNumber) {
    // Move the current time indicator
    var idMvCT = stringIDToTypeID("move");
    var desc   = new ActionDescriptor();
    var idTime = stringIDToTypeID("time");
    var descT  = new ActionDescriptor();
    descT.putInteger(stringIDToTypeID("frame"), frameNumber);
    descT.putInteger(stringIDToTypeID("frameRate"), FRAME_RATE);
    desc.putObject(idTime, stringIDToTypeID("timecode"), descT);
    executeAction(stringIDToTypeID("setCurrentTime"), desc, DialogModes.NO);

    // Add a keyframe for layer style on the active layer
    var idAddK  = stringIDToTypeID("addKeyframe");
    var descK   = new ActionDescriptor();
    var refL    = new ActionReference();
    refL.putEnumerated(
        charIDToTypeID("Lyr "),
        charIDToTypeID("Ordn"),
        charIDToTypeID("Trgt")
    );
    descK.putReference(charIDToTypeID("null"), refL);
    descK.putString(stringIDToTypeID("property"), "style");
    executeAction(idAddK, descK, DialogModes.NO);
}

// ── MAIN LOOP ────────────────────────────────────────────────────────────────
doc.activeLayer = targetLayer;

var frame = START_FRAME;
for (var alt = START_ALT; alt <= END_ALT; alt++) {
    setBevelAltitude(targetLayer, alt);
    setKeyframeAtFrame(frame);
    frame += FRAME_DURATION;
}

alert("Done! " + (END_ALT - START_ALT + 1) + " keyframes added.\nExport with File → Export → Render Video.");
