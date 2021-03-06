"use strict";

/**
 * NLA scheduler module.
 * @name nla
 * @namespace
 * @exports exports as nla
 */
b4w.module["__nla"] = function(exports, require) {

var m_anim      = require("__animation");
var m_cam       = require("__camera");
var m_ctl       = require("__controls");
var m_cfg       = require("__config");
var m_loader    = require("__loader");
var m_particles = require("__particles");
var m_print     = require("__print");
var m_scs       = require("__scenes");
var m_sfx       = require("__sfx");
var m_util      = require("__util");
var m_tex       = require("__textures");

var cfg_ani = m_cfg.animation;
var cfg_def = m_cfg.defaults;
var _nla_arr = [];
var _start_time = -1;

// to fix precision issues with freezing current frame
var CF_FREEZE_EPSILON = 0.000001;

exports.update_scene_nla = function(scene, is_cyclic) {
    var nla = {
        frame_start: scene["frame_start"],
        frame_end: scene["frame_end"],
        frame_offset: 0,
        last_frame: -1,
        cyclic: is_cyclic,
        objects: [],
        textures: [],
        script: [],
        curr_script_slot: 0,
        registers: {
            "R1" : 0,
            "R2" : 0,
            "R3" : 0,
            "R4" : 0,
            "R5" : 0,
            "R6" : 0,
            "R7" : 0,
            "R8" : 0
        }
    }
    
    prepare_nla_script(scene, nla);

    var sobjs = m_scs.get_scene_objs(scene, "ALL", m_scs.DATA_ID_ALL);

    for (var i = 0; i < sobjs.length; i++) {
        var sobj = sobjs[i];
        var slot_num = 0;
        var obj_nla_events = [];

        var adata = sobj["animation_data"];
        if (adata && adata["nla_tracks"].length) {
            var nla_tracks = adata["nla_tracks"];

            if (m_util.is_armature(sobj) ||
                    m_cam.is_camera(sobj) ||
                    m_util.is_mesh(sobj) ||
                    m_util.is_empty(sobj) ||
                    // no need for separate slot in case of sound
                    m_sfx.is_speaker(sobj)) {

                var nla_events = get_nla_events(nla_tracks, slot_num);
                if (nla_events.length) {
                    obj_nla_events = obj_nla_events.concat(nla_events);
                    slot_num++;
                }
            }
        }

        if (has_spk_param_nla(sobj)) {
            var nla_tracks = sobj["data"]["animation_data"]["nla_tracks"];
            var nla_events = get_nla_events(nla_tracks, slot_num);

            if (nla_events.length) {
                obj_nla_events = obj_nla_events.concat(nla_events);
                slot_num++;
            }
        }

        if (m_anim.has_animated_nodemats(sobj)) {
            var materials = sobj["data"]["materials"];

            for (var j = 0; j < materials.length; j++) {
                var mat = materials[j];
                var node_tree = mat["node_tree"];
                var adata = node_tree["animation_data"];
                if (node_tree && adata) {
                    var nla_tracks = adata["nla_tracks"];
                    var nla_events = get_nla_events(nla_tracks, -1);

                    var mat_anim_names = [];

                    for (var k = 0; k < nla_events.length; k++) {
                        var ev = nla_events[k];

                        if (mat_anim_names.indexOf(ev.anim_name) == -1)
                            mat_anim_names.push(ev.anim_name);

                        ev.anim_slot = slot_num + 
                                mat_anim_names.indexOf(ev.anim_name);

                        obj_nla_events.push(ev);
                    }

                    slot_num += mat_anim_names.length;
                }
            }
        }

        for (var j = 0; j < sobj["particle_systems"].length; j++) {
            var psys = sobj["particle_systems"][j];
            var pset = psys["settings"];

            if (pset["type"] == "EMITTER" && pset["b4w_allow_nla"]) {
                var ev = init_event();

                ev.type = "CLIP";
                ev.frame_start = nla.frame_start;
                ev.frame_end = nla.frame_end+1;
                ev.anim_name = psys["name"];
                ev.anim_slot = slot_num;

                obj_nla_events.push(ev);
                slot_num++;
            }
        }

        var slot_num_va = slot_num+1;

        // NOTE: the data is missing in the meta objects
        if (m_util.is_mesh(sobj) && sobj["data"]) {
            for (var j = 0; j < sobj["data"]["b4w_vertex_anim"].length; j++) {
                var va = sobj["data"]["b4w_vertex_anim"][j];

                if (va["allow_nla"]) {
                    slot_num = slot_num_va;

                    var ev = init_event();

                    ev.type = "CLIP";
                    ev.frame_start = nla.frame_start;
                    ev.frame_end = nla.frame_end+1;
                    ev.anim_name = va["name"];
                    ev.anim_slot = slot_num;
                    obj_nla_events.push(ev);
                }
            }
        }

        if (obj_nla_events.length) {
            sobj._nla_events = obj_nla_events;
            nla.objects.push(sobj);
        }

    }

    var textures = scene._render.video_textures;
    for (var j = 0; j < textures.length; j++) {
        var texture = textures[j]._render;
        if (texture.video_file || texture.seq_video) {
            var ev = init_event();

            ev.type = "VIDEO";
            var fps_mult = 1;
            if (cfg_def.seq_video_fallback)
                fps_mult = texture.fps;

            ev.frame_start = Math.min(texture.frame_start * fps_mult, nla.frame_end);

            if (texture.use_cyclic)
                ev.frame_end = nla.frame_end;
            else 
                ev.frame_end =  Math.min((texture.frame_duration + texture.frame_start 
                        + texture.frame_offset) * fps_mult, nla.frame_end);

            ev.anim_name = textures[j].name;

            texture._nla_tex_event = ev;
            nla.textures.push(texture);
        }
    }

    enforce_nla_consistency(nla);
    calc_nla_extents(nla);

    _nla_arr.push(nla);
}

function init_event() {
    var ev = {
        type: "CLIP",
        frame_start: 0,
        frame_end: 0,
        scheduled: false,
        paused: false,
        anim_name: "",
        anim_slot: 0,
        action_frame_start: 0,
        action_frame_end: 0,
        ext_frame_start: 0,
        ext_frame_end: 0,
        stop_video: false
    }

    return ev;
}

function prepare_nla_script(scene, nla) {
    var bpy_nla_script = scene["b4w_nla_script"];
    var nla_script = nla.script;

    for (var i = 0; i < bpy_nla_script.length; i++) {
        var sslot = bpy_nla_script[i];

        switch (sslot["type"]) {
        case "PLAY":
            nla_script.push({
                type: "PLAY",
                frame_start: sslot["frame_range"][0],
                frame_end: sslot["frame_range"][1],
                in_play: false
            });
            break;
        case "SELECT":
        case "SELECT_PLAY":
            var obj = m_scs.get_object(m_scs.GET_OBJECT_BY_NAME, sslot["object"], 0);

            var sel_objs = m_scs.get_selectable_objects(scene);
            var obj_idx = sel_objs.indexOf(obj);

            if (obj_idx == -1) {
                m_print.error("NLA script error: non-selectable object");
                return [];
            }

            var slot = {
                type: sslot["type"],
                slot_idx_hit: sslot["type"] == "SELECT" ? sslot["target_slot"] : i+1,
                slot_idx_miss: i+1,
                sel_state: -1,
                sel_objs_len: sel_objs.length,
                sel_obj_idx: obj_idx,

                frame_start: sslot["frame_range"][0],
                frame_end: sslot["frame_range"][1],
                in_play: false
            }

            var sel_sensors = [];
            for (var j = 0; j < sel_objs.length; j++) {
                sel_sensors.push(m_ctl.create_selection_sensor(sel_objs[j], true));
            }

            var select_cb = function(obj, id, pulse, param) {
                if (nla.curr_script_slot >= nla.script.length)
                    return;

                var slot = nla.script[nla.curr_script_slot];

                if (!(slot.type == "SELECT" || (slot.type == "SELECT_PLAY" && !slot.in_play)))
                    return;

                for (var i = 0; i < param.sel_objs_len; i++) {
                    if (m_ctl.get_sensor_value(obj, id, i) &&
                            i == param.sel_obj_idx) {
                        param.sel_state = 1;
                        return;
                    }
                }
                param.sel_state = 0;
            }

            m_ctl.create_sensor_manifold(obj, "NLA_SELECT_" + i, m_ctl.CT_SHOT,
                    sel_sensors, m_ctl.default_OR_logic_fun, select_cb, slot);

            nla_script.push(slot);

            break;
        case "JUMP":
            nla_script.push({
                type: "JUMP",
                slot_idx: sslot["target_slot"]
            });
            break;
        case "CONDJUMP":
            nla_script.push({
                type: "CONDJUMP",
                slot_idx: sslot["target_slot"],
                cond: sslot["condition"],
                reg1: sslot["register1"],
                reg2: sslot["register2"],
                num1: sslot["number1"],
                num2: sslot["number2"]
            });
            break;
        case "REGSTORE":
            nla_script.push({
                type: "REGSTORE",
                reg: sslot["registerd"],
                num: sslot["number1"]
            });
            break;
        case "MATH":
            nla_script.push({
                type: "MATH",
                op: sslot["operation"],
                reg1: sslot["register1"],
                reg2: sslot["register2"],
                num1: sslot["number1"],
                num2: sslot["number2"],
                regd: sslot["registerd"]
            });
            break;
        case "SHOW":
        case "HIDE":
            var obj = m_scs.get_object(m_scs.GET_OBJECT_BY_NAME, sslot["object"], 0);
            nla_script.push({
                type: sslot["type"],
                obj: obj
            });
            break;
        case "REDIRECT":
            nla_script.push({
                type: "REDIRECT",
                url: sslot["url"]
            });
            break;
        case "PAGEPARAM":
            nla_script.push({
                type: "PAGEPARAM",
                param_name: sslot["param_name"],
                regd: sslot["registerd"]
            });
            break;
        case "NOOP":
            nla_script.push({
                type: "NOOP"
            });
            break;
        default:
            break;
        }
    }
}

function enforce_nla_consistency(nla) {

    var start = nla.frame_start;
    var end = nla.frame_end;

    for (var i = 0; i < nla.objects.length; i++) {
        var obj = nla.objects[i];

        var nla_events = obj._nla_events;

        for (var j = 0; j < nla_events.length; j++) {
            var ev = nla_events[j];

            // for possible warnings
            var strip_str = obj["name"] + " [" + ev.frame_start + ":" +
                    ev.frame_end + "]";

            ev.frame_start = Math.max(start, ev.frame_start);
            // see typical cyclic NLA usecases to undestand why +1
            ev.frame_end = Math.min(end+1, ev.frame_end);

            // out of scene range
            if (ev.frame_start > ev.frame_end) {
                m_print.warn("NLA: out of scene range: " + strip_str);
                nla_events.splice(j, 1);
                j--;
            }
        }
    }
}

function calc_nla_extents(nla) {

    for (var i = 0; i < nla.objects.length; i++) {
        var obj = nla.objects[i];

        var nla_events = obj._nla_events;

        for (var j = 0; j < nla_events.length; j++) {
            var ev = nla_events[j];

            var ext_frame_start = nla.frame_start;
            var ext_frame_end = nla.frame_end+1;

            for (var k = 0; k < nla_events.length; k++) {
                var ev_k = nla_events[k];

                // slots are like NLA tracks in Blender
                if (ev.anim_slot != ev_k.anim_slot)
                    continue;

                if (ev_k.frame_end <= ev.frame_start)
                    ext_frame_start = ev.frame_start;

                if (ev_k.frame_start >= ev.frame_end)
                    ext_frame_end = Math.min(ext_frame_end, ev_k.frame_start);
            }

            ev.ext_frame_start = ext_frame_start;
            ev.ext_frame_end = ext_frame_end;
        }
    }
}

exports.start = function() {
    _start_time = 0;
}

/**
 * Called every frame
 */
exports.update = function(timeline, elapsed) {

    if (_start_time < 0)
        return;
    else if (_start_time == 0)
        _start_time = timeline; // initialize timer at first iteration

    for (var i = 0; i < _nla_arr.length; i++) {
        var nla = _nla_arr[i];

        process_nla_script(nla, timeline, elapsed, _start_time);

        var cf = calc_curr_frame(nla, timeline, _start_time, true);

        for (var j = 0; j < nla.objects.length; j++) {
            var obj = nla.objects[j];
            var nla_events = obj._nla_events;

            // NOTE: allow single-strip speakers to play again
            for (var k = 0; k < nla_events.length; k++) {
                var ev = nla_events[k];

                if (ev.type == "SOUND" && cf < (nla.last_frame - CF_FREEZE_EPSILON)) {
                    ev.scheduled = false;
                }
            }

            for (var k = 0; k < nla_events.length; k++) {
                var ev = nla_events[k];

                switch (ev.type) {
                case "CLIP":
                    if (ev.ext_frame_start <= cf && cf < ev.ext_frame_end)
                        if (!ev.scheduled) {
                            process_clip_event_start(obj, ev, cf, elapsed);

                            for (var l = 0; l < nla_events.length; l++)
                                if (nla_events[l] != ev &&
                                        nla_events[l].anim_slot == ev.anim_slot)
                                    nla_events[l].scheduled = false;

                            ev.scheduled = true;
                        }

                    if (ev.scheduled)
                        process_clip_event(obj, ev, cf, elapsed);

                    break;
                case "SOUND":
                    if ((cf < (nla.last_frame - CF_FREEZE_EPSILON) || nla.last_frame < ev.frame_start) &&
                            ev.frame_start <= cf && cf < ev.frame_end) {
                        if (!ev.scheduled) {
                            process_sound_event(obj, ev, cf);
                            ev.scheduled = true;
                        }
                    }

                    if (nla.last_frame < ev.frame_end && ev.frame_end <= cf) {
                        if (ev.scheduled) {
                            ev.scheduled = false;
                        }
                    }
                    break;
                default:
                    break;
                }
            }

        }

        for (var j = 0; j < nla.textures.length; j++) {
            ev = nla.textures[j]._nla_tex_event;
            if (ev.frame_start <= Math.round(cf) && Math.round(cf) < ev.frame_end) 
                if (!ev.stop_video) {
                    process_video_event(nla.textures[j], ev.stop_video);
                    ev.stop_video = true;
                }
            if (ev.frame_end <= Math.round(cf))
                if (ev.stop_video) {
                    process_video_event(nla.textures[j], ev.stop_video);
                    ev.stop_video = false;
                }
        }
        nla.last_frame = cf;
    }
}

function process_nla_script(nla, timeline, elapsed, start_time) {

    if (!nla.script.length)
        return;

    if (nla.curr_script_slot >= nla.script.length) {
        if (nla.cyclic) {
            nla.curr_script_slot = 0;
        } else {
            // freeze
            nla.frame_offset -= cfg_ani.framerate * elapsed;
            return;
        }
    }

    var cf = calc_curr_frame(nla, timeline, start_time, false);

    var slot = nla.script[nla.curr_script_slot];

    switch (slot.type) {
    case "PLAY":
        if (!slot.in_play) {
            nla.frame_offset += (slot.frame_start - cf);
            slot.in_play = true;
            reset_nla_selection(nla, slot);
        } else {
            if (cf >= slot.frame_end) {
                slot.in_play = false;
                nla.curr_script_slot++;
                process_nla_script(nla, timeline, elapsed, start_time);
            }
        }
        break;
    case "SELECT":
    case "SELECT_PLAY":
        if (slot.sel_state > -1) {

            if (slot.type == "SELECT" || (slot.type == "SELECT_PLAY" && slot.sel_state == 0)) {
                nla.curr_script_slot = slot.sel_state ? slot.slot_idx_hit : slot.slot_idx_miss;
                slot.sel_state = -1;
                process_nla_script(nla, timeline, elapsed, start_time);
            } else {
                if (!slot.in_play) {
                    nla.frame_offset += (slot.frame_start - cf);
                    slot.in_play = true;
                    reset_nla_selection(nla, slot);
                } else {
                    if (cf >= slot.frame_end) {
                        slot.in_play = false;
                        nla.curr_script_slot = slot.slot_idx_hit;
                        slot.sel_state = -1;
                        process_nla_script(nla, timeline, elapsed, start_time);
                    }
                }
            }

        } else {
            // freeze
            nla.frame_offset -= cfg_ani.framerate * elapsed;
        }

        break;
    case "JUMP":
        nla.curr_script_slot = slot.slot_idx;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "CONDJUMP":
        var val1 = (slot.reg1 == -1) ? slot.num1 : nla.registers[slot.reg1];
        var val2 = (slot.reg2 == -1) ? slot.num2 : nla.registers[slot.reg2];
        var cond_result = false;

        switch (slot.cond) {
        case "EQUAL":
            if (val1 == val2)
                cond_result = true;
            break;
        case "NOTEQUAL":
            if (val1 != val2)
                cond_result = true;
            break;
        case "LESS":
            if (val1 < val2)
                cond_result = true;
            break;
        case "GREATER":
            if (val1 > val2)
                cond_result = true;
            break;
        case "LEQUAL":
            if (val1 <= val2)
                cond_result = true;
            break;
        case "GEQUAL":
            if (val1 >= val2)
                cond_result = true;
            break;
        }

        if (cond_result)
            nla.curr_script_slot = slot.slot_idx;
        else
            nla.curr_script_slot++;

        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "REGSTORE":
        nla.registers[slot.reg] = slot.num;
        nla.curr_script_slot++;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "MATH":
        var val1 = (slot.reg1 == -1) ? slot.num1 : nla.registers[slot.reg1];
        var val2 = (slot.reg2 == -1) ? slot.num2 : nla.registers[slot.reg2];

        switch (slot.op) {
        case "ADD":
            nla.registers[slot.regd] = val1 + val2;
            break;
        case "MUL":
            nla.registers[slot.regd] = val1 * val2;
            break;
        case "SUB":
            nla.registers[slot.regd] = val1 - val2;
            break;
        case "DIV":
            if (val2 == 0)
                m_util.panic("Division by zero in NLA script");

            nla.registers[slot.regd] = val1 / val2;
            break;
        }

        nla.curr_script_slot++;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "SHOW":
        m_scs.show_object(slot.obj);

        nla.curr_script_slot++;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "HIDE":
        m_scs.hide_object(slot.obj);

        nla.curr_script_slot++;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "REDIRECT":
        window.location.href = slot.url

        // prevents further NLA processing
        nla.script.length = 0;
        break;
    case "PAGEPARAM":
        nla.registers[slot.regd] = get_url_param(slot.param_name);

        nla.curr_script_slot++;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    case "NOOP":
        nla.curr_script_slot++;
        process_nla_script(nla, timeline, elapsed, start_time);
        break;
    }
}

/**
 * Return numerical URL param
 */
function get_url_param(name) {

    var url = location.href.toString();
    if (url.indexOf("?") == -1)
        return 0;

    var params = url.split("?")[1].split("&");

    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");

        if (param.length > 1 && param[0] == name)
            return Number(param[1]);
    }

    return 0;
}

function reset_nla_selection(nla, curr_slot) {
    var nla_script = nla.script;

    for (var i = 0; i < nla_script.length; i++) {
        var slot = nla_script[i];
        if (slot != curr_slot)
            slot.sel_state = -1;
    }
}

function pause_scheduled_objects(objects) {
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        var nla_events = obj._nla_events;
        for (var j = 0; j < nla_events.length; j++) {
            var ev = nla_events[j];
            if (ev.scheduled && !ev.paused) {
                process_event_pause(obj);
                ev.paused = true;
            }
        }
    }
}

function resume_scheduled_objects(objects) {
    for (var i = 0; i < objects.length; i++) {
        var obj = objects[i];
        var nla_events = obj._nla_events;
        for (var j = 0; j < nla_events.length; j++) {
            var ev = nla_events[j];
            if (ev.paused) {
                process_event_resume(obj);
                ev.paused = false;
            }
        }
    }
}

function calc_curr_frame(nla, timeline, start_time, allow_repeat) {

    var cf = (timeline - start_time) * cfg_ani.framerate + nla.frame_offset -
            nla.frame_start;

    if (nla.cyclic && allow_repeat) {
        var stride = nla.frame_end - nla.frame_start + 1;
        cf %= stride;
    }
    cf += nla.frame_start;

    return cf;
}

function process_clip_event_start(obj, ev, frame, elapsed) {
    m_anim.apply(obj, ev.anim_name, ev.anim_slot);
    // NOTE: should not be required
    m_anim.set_behavior(obj, m_anim.AB_FINISH_STOP, ev.anim_slot);
}

function process_clip_event(obj, ev, frame, elapsed) {
    var init_anim_frame = frame - ev.frame_start + ev.action_frame_start;
    m_anim.set_current_frame_float(obj, init_anim_frame, ev.anim_slot);
    m_anim.update_object_animation(obj, 0, ev.anim_slot);
}

function process_sound_event(obj, ev, frame) {
    var when = (ev.frame_start - frame) / cfg_ani.framerate;
    var duration = (ev.frame_end - ev.frame_start) / cfg_ani.framerate;
    m_sfx.play(obj, when, duration);
}

function process_video_event(texture, stop) {
    if (stop)
        m_tex.pause_video(texture.name);
    else {
        m_tex.reset_video(texture.name);
        m_tex.play_video(texture.name);
    }
}

exports.cleanup = function() {
    _nla_arr.length = 0;
    _start_time = -1;
}

/**
 * Convert NLA tracks to events
 */
function get_nla_events(nla_tracks, anim_slot_num) {

    var nla_events = [];

    for (var i = 0; i < nla_tracks.length; i++) {
        var track = nla_tracks[i];

        var strips = track["strips"];
        if (!strips)
            continue;

        for (var j = 0; j < strips.length; j++) {
            var strip = strips[j];

            var ev = init_event();

            ev.type = strip["type"];
            ev.frame_start = strip["frame_start"];
            ev.frame_end = strip["frame_end"];
            ev.anim_name = strip["action"] ? strip["action"]["name"] : "";
            ev.anim_slot = anim_slot_num;
            ev.action_frame_start = strip["action_frame_start"];
            ev.action_frame_end = strip["action_frame_end"];

            nla_events.push(ev);
        }
    }

    return nla_events;
}

exports.has_nla = function(obj) {
    // TODO: particles/vertex animation
    var adata = obj["animation_data"];

    if ((adata && adata["nla_tracks"].length) || has_spk_param_nla(obj) ||
            m_anim.has_animated_nodemats(obj))
        return true;
    else
        return false;
}

function has_spk_param_nla(obj) {
    if (m_sfx.is_speaker(obj) && obj["data"]["animation_data"] &&
            obj["data"]["animation_data"]["nla_tracks"].length)
        return true;
    else
        return false;
}

}
