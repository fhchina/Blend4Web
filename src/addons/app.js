"use strict";

/**
 * Application add-on.
 * Provides generic routines for engine initialization, UI and I/O.
 * @module app
 */
b4w.module["app"] = function(exports, require) {

var m_anim  = require("animation");
var m_cam   = require("camera");
var m_cfg   = require("config");
var m_ctl   = require("controls");
var m_data  = require("data");
var m_dbg   = require("debug");
var m_main  = require("main");
var m_phy   = require("physics");
var m_print = require("print");
var m_scs   = require("scenes");
var m_trans = require("transform");
var m_util  = require("util");

var m_vec3 = require("vec3");

// radian/pixel
var MOUSE_ROTATION_MULT_PX = 0.01;
var TOUCH_ROTATION_MULT_PX = 0.007;

var MOUSE_ZOOM_FACTOR = 0.1;
var TOUCH_ZOOM_FACTOR = 0.005;

var CAM_SMOOTH_ZOOM_MOUSE = 0.1;
var CAM_SMOOTH_ZOOM_TOUCH = 0.15;

var CAM_SMOOTH_ROT_MOUSE = 0.08;
var CAM_SMOOTH_ROT_TOUCH = 0.12;

// assumed there are development and release versions of htmls

var _canvas_container_elem = null;
var _canvas_elem = null;
var _fps_logger_elem = null;

// for internal usage
var _vec3_tmp   = new Float32Array(3);

/**
 * Initialize engine.
 * Options may be extended by properties from engine configuration.
 * In that case they will be applied before engine initialization.
 * @param {Object} [options={}] Initialization options.
 * @param {String} [options.canvas_containter_id=null] Canvas container ID.
 * @param {Function} [options.callback=function(){}] Initialization callback.
 * @param {Boolean} [options.do_not_use_onload=false] Prevent registration of
 * window.onload event handler.
 * @param {Boolean} [options.gl_debug=false] Enable WebGL debugging.
 * @param {Boolean} [options.show_hud_debug_info=false] Show HUD with developer info.
 * @param {Boolean} [options.show_fps=false] Show FPS counter.
 * @param {Boolean} [options.do_not_report_init_failure=false] Disable DIV
 * @param {Boolean} [options.pause_invisible=true] Pause engine simulation if
 * page is not visible (in other tab or minimized).
 * element with failure message if WebGL is not available.
 */
exports.init = function(options) {
    options = options || {};

    var canvas_container_id = null;
    var callback = function() {};
    var do_not_use_onload = false;
    var gl_debug = false;
    var show_hud_debug_info = false;
    var sfx_mix_mode = false;
    var show_fps = false;
    var fps_elem_id = null;
    var bar_id = null;
    var caption_id = null;
    var do_not_report_init_failure = false;
    var pause_invisible = true;

    for (var opt in options) {
        switch (opt) {
        case "canvas_container_id":
            canvas_container_id = options["canvas_container_id"];
            break;
        case "callback":
            callback = options["callback"];
            break;
        case "do_not_use_onload":
            do_not_use_onload = options["do_not_use_onload"];
            break;
        case "gl_debug":
            gl_debug = options["gl_debug"];
            break;
        case "show_hud_debug_info":
            show_hud_debug_info = options["show_hud_debug_info"];
            break;
        case "sfx_mix_mode":
            sfx_mix_mode = options["sfx_mix_mode"];
            break;
        case "show_fps":
            show_fps = options["show_fps"];
            break;
        case "fps_elem_id":
            fps_elem_id = options["fps_elem_id"];
            break;
        case "bar_id":
            bar_id = options["bar_id"];
            break;
        case "caption_id":
            caption_id = options["caption_id"];
            break;
        case "do_not_report_init_failure":
            do_not_report_init_failure = options["do_not_report_init_failure"];
            break;
        case "pause_invisible":
            pause_invisible = options["pause_invisible"];
            break;
        default:
            m_cfg.set(opt, options[opt]);
            break;
        }
    }

    m_cfg.set("show_hud_debug_info", show_hud_debug_info);
    m_cfg.set("sfx_mix_mode", sfx_mix_mode);

    var init_hud_canvas = show_hud_debug_info || sfx_mix_mode || null;

    var onload_cb = function() {

        var cont_elem = setup_canvas(canvas_container_id, init_hud_canvas, 
                do_not_report_init_failure);
        if (!cont_elem) {
            callback(_canvas_elem, false);
            return;
        }

        _canvas_container_elem = cont_elem;

        m_main.set_check_gl_errors(gl_debug);

        if (show_fps) {
            create_fps_logger_elem(fps_elem_id);
            m_main.set_fps_callback(fps_callback);
        }

        if (pause_invisible)
            handle_page_visibility();

        callback(_canvas_elem, true);
    };

    var onunload_cb = function() {
        m_main.pause();
        m_data.cleanup();
    };

    if (do_not_use_onload) {
        onload_cb();
        onunload_cb();
    } else {
        add_to_onload(onload_cb);
        add_to_onunload(onunload_cb);
    }
}

function handle_page_visibility() {

    var was_paused = m_main.is_paused();

    var visibility_change = function() {
        if (document.hidden) {
            was_paused = m_main.is_paused();
            m_main.pause();
        } else if (!was_paused)
            m_main.resume();
    }
    document.addEventListener("visibilitychange", visibility_change, false);
}

function add_to_onload(new_onload) {
    var old_onload = window.onload;
    window.onload = function() {
        if (typeof old_onload == "function")
            old_onload();
        new_onload();
    }
}

function add_to_onunload(new_onunload) {
    var old_onunload = window.onunload;
    window.onunload = function() {
        if (typeof old_onunload == "function")
            old_onunload();
        new_onunload();
    }
}

function setup_canvas(canvas_container_id, init_hud_canvas, 
        do_not_report_init_failure) {

    var canvas_elem = document.createElement("canvas");
    canvas_elem.style.cssText = "position: absolute;left:0px; top:0px;"

    if (init_hud_canvas) {
        var canvas_elem_hud = document.createElement("canvas");
        // NOTE: pointer-events only for Chrome, Firefox, Safari
        canvas_elem_hud.style.cssText = "z-index: 2; position:absolute; " +
            "left:0px; top:0px; pointer-events: none;"
    } else
        var canvas_elem_hud = null;


    if (!m_main.init(canvas_elem, canvas_elem_hud)) {
        if (!do_not_report_init_failure)
            alert_web("Browser could not initialize WebGL", "For more info visit", 
                      "http://get.webgl.org/troubleshooting");
        return null;
    }

    _canvas_elem = canvas_elem;

    var append_to = document.getElementById(canvas_container_id);
    if (!append_to) {
        m_print.error("Warning: canvas container \"" + canvas_container_id + 
            "\" not found, appending to body");
        append_to = document.body;
    }
    append_to.appendChild(canvas_elem);

    if (canvas_elem_hud)
        append_to.appendChild(canvas_elem_hud);

    return append_to;
}

function create_fps_logger_elem(fps_elem_id) {

    if (fps_elem_id)
        _fps_logger_elem = document.getElementById(fps_elem_id);
    else {
        _fps_logger_elem = document.createElement("div");
        _fps_logger_elem.innerHTML = 0;
        _fps_logger_elem.style.cssText = " \
            position:absolute;\
            top: 23px;\
            right: 20px;\
            font-size: 45px;\
            line-height: 50px;\
            font-weight: bold;\
            color: #000;\
            z-index: 1;\
        ";
        document.body.appendChild(_fps_logger_elem);
    }
}

function fps_callback(fps, phy_fps) {

    var fps_str = String(fps);
    if (phy_fps)
        fps_str += "/" + String(phy_fps);

    _fps_logger_elem.innerHTML = fps_str;
}

function elem_cloned(elem_id) {

    var target = document.getElementById(elem_id);

    // clone to prevent adding event listeners more than once
    var new_element = target.cloneNode(true);
    target.parentNode.replaceChild(new_element, target);
    
    return new_element;
}

exports.get_canvas_container = function() {
    return _canvas_container_elem;
}

exports.set_onclick = function(elem_id, callback) {
    var elem = elem_cloned(elem_id);
    elem.addEventListener("mouseup", function(e) {
        callback(elem.value);
    }, false);
}

exports.set_onchange = function(elem_id, callback) {
    var elem = elem_cloned(elem_id);
    elem.addEventListener("change", function(e) {
        var checked = elem.checked;
        var rslt = checked != undefined ? checked : elem.value;
        callback(rslt);
    }, false);
}

exports.set_onkeypress = function(elem_id, callback) {
    var elem = elem_cloned(elem_id);
    elem.addEventListener("keypress", function(e) {
        callback(e.keyCode, elem.value);
    }, false);
}

/**
 * Enable camera keyboard and mouse controls:
 * arrow keys, ADSW, wheel and others
 * @param {Number} [trans_speed=1] Translation speed
 * @param {Number} [rot_speed=1] Rotation speed
 * @param {Number} [zoom_speed=1] Zoom speed
 * @param {Boolean} [disable_default_pivot=false] Do not use possible 
 * camera-defined pivot point
 */
exports.enable_camera_controls = function(trans_speed, rot_speed, zoom_speed,
        disable_default_pivot) {

    if (!trans_speed)
        var trans_speed = 1;
    if (!rot_speed)
        var rot_speed = 1;
    if (!zoom_speed)
        var zoom_speed = 1;

    // hack to allow fullscreen
    document.addEventListener("keydown", on_key_fullscreen, false);

    function on_key_fullscreen(e) {
        if (e.keyCode == m_ctl.KEY_O)
            request_fullscreen(document.body);
        else if (e.keyCode == m_ctl.KEY_P) {

            if (m_main.is_paused())
                m_main.resume();
            else
                m_main.pause();
        }
    }

    var obj = m_scs.get_active_camera();

    if (disable_default_pivot)
        var use_pivot = false;
    else
        var use_pivot = m_cam.get_move_style(obj) == 
                m_cam.MS_TARGET_CONTROLS ? true : false;


    var elapsed = m_ctl.create_elapsed_sensor();

    var use_physics = m_phy.has_simulated_physics(obj);

    var key_cb = function(obj, id, value, pulse) {
        // clear forces
        if (use_physics)
            m_phy.apply_force(obj, 0, 0, 0);

        if (pulse == 1) {

            var elapsed = value;

            var CAM_FORCE_MULT = [1800, 2100, 1800];
            var t_mult = m_cam.get_trans_speed(obj);
            var r_mult = 2.0;

            switch (id) {
            case "FORWARD":
                if (use_physics)
                    m_phy.apply_force(obj, 0, -CAM_FORCE_MULT[1], 0);
                else
                    m_trans.move_local(obj, 0, -trans_speed * t_mult * elapsed, 0);
                break;
            case "BACKWARD":
                if (use_physics)
                    m_phy.apply_force(obj, 0, CAM_FORCE_MULT[1], 0);
                else
                    m_trans.move_local(obj, 0, trans_speed * t_mult * elapsed, 0);
                break;
            case "UP":
                if (use_physics)
                    m_phy.apply_force(obj, 0, 0, -CAM_FORCE_MULT[2]);
                else
                    m_trans.move_local(obj, 0, 0, -trans_speed * t_mult * elapsed);
                break;
            case "DOWN":
                if (use_physics)
                    m_phy.apply_force(obj, 0, 0, CAM_FORCE_MULT[2]);
                else
                    m_trans.move_local(obj, 0, 0, trans_speed * t_mult * elapsed);
                break;
            case "LEFT":
                if (use_physics)
                    m_phy.apply_force(obj, -CAM_FORCE_MULT[0], 0, 0);
                else
                    m_trans.move_local(obj, -trans_speed * t_mult * elapsed, 0, 0);
                break;
            case "RIGHT":
                if (use_physics)
                    m_phy.apply_force(obj, CAM_FORCE_MULT[0], 0, 0);
                else
                    m_trans.move_local(obj, trans_speed * t_mult * elapsed, 0, 0);
                break;
            case "ROT_LEFT":
                if (use_pivot)
                    m_cam.rotate_pivot(obj, -rot_speed * r_mult * elapsed, 0);
                else
                    m_cam.rotate(obj, rot_speed * r_mult * elapsed, 0);
                break;
            case "ROT_RIGHT":
                if (use_pivot)
                    m_cam.rotate_pivot(obj, rot_speed * r_mult * elapsed, 0);
                else
                    m_cam.rotate(obj, -rot_speed * r_mult * elapsed, 0);
                break;
            case "ROT_UP":
                if (use_pivot)
                    m_cam.rotate_pivot(obj, 0, -rot_speed * r_mult * elapsed);
                else
                    m_cam.rotate(obj, 0, -rot_speed * r_mult * elapsed);
                break;
            case "ROT_DOWN":
                if (use_pivot)
                    m_cam.rotate_pivot(obj, 0, rot_speed * r_mult * elapsed);
                else
                    m_cam.rotate(obj, 0, rot_speed * r_mult * elapsed);
                break;
            case "ROT_LEFT":
                if (use_pivot)
                    m_cam.rotate_pivot(obj, -rot_speed * r_mult * elapsed, 0);
                else
                    m_cam.rotate(obj, rot_speed * r_mult * elapsed, 0);
                break;
            case "ROT_RIGHT":
                if (use_pivot)
                    m_cam.rotate_pivot(obj, rot_speed * r_mult * elapsed, 0);
                else
                    m_cam.rotate(obj, -rot_speed * r_mult * elapsed, 0);
                break;
            default:
                break;
            }
        }
    }

    var key_w = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
    var key_s = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
    var key_a = m_ctl.create_keyboard_sensor(m_ctl.KEY_A);
    var key_d = m_ctl.create_keyboard_sensor(m_ctl.KEY_D);
    var key_r = m_ctl.create_keyboard_sensor(m_ctl.KEY_R);
    var key_f = m_ctl.create_keyboard_sensor(m_ctl.KEY_F);

    var key_up = m_ctl.create_keyboard_sensor(m_ctl.KEY_UP);
    var key_down = m_ctl.create_keyboard_sensor(m_ctl.KEY_DOWN);
    var key_left = m_ctl.create_keyboard_sensor(m_ctl.KEY_LEFT);
    var key_right = m_ctl.create_keyboard_sensor(m_ctl.KEY_RIGHT);

    var key_single_logic = null;
    var key_double_logic = function(s) {
        return s[0] && (s[1] || s[2]);
    }

    m_ctl.create_sensor_manifold(obj, "FORWARD", m_ctl.CT_CONTINUOUS, 
            [elapsed, key_w], key_single_logic, key_cb);
    m_ctl.create_sensor_manifold(obj, "BACKWARD", m_ctl.CT_CONTINUOUS,
            [elapsed, key_s], key_single_logic, key_cb);

    if (use_pivot) {
        m_ctl.create_sensor_manifold(obj, "ROT_UP", m_ctl.CT_CONTINUOUS,
                [elapsed, key_up, key_r], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_DOWN", m_ctl.CT_CONTINUOUS,
                [elapsed, key_down, key_f], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_LEFT", m_ctl.CT_CONTINUOUS,
                [elapsed, key_left, key_a], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_RIGHT", m_ctl.CT_CONTINUOUS,
                [elapsed, key_right, key_d], key_double_logic, key_cb);
    } else {
        m_ctl.create_sensor_manifold(obj, "UP", m_ctl.CT_CONTINUOUS,
                [elapsed, key_r], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "DOWN", m_ctl.CT_CONTINUOUS,
                [elapsed, key_f], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "LEFT", m_ctl.CT_CONTINUOUS,
                [elapsed, key_a], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "RIGHT", m_ctl.CT_CONTINUOUS,
                [elapsed, key_d], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_UP", m_ctl.CT_CONTINUOUS,
                [elapsed, key_up], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_DOWN", m_ctl.CT_CONTINUOUS,
                [elapsed, key_down], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_LEFT", m_ctl.CT_CONTINUOUS,
                [elapsed, key_left], key_double_logic, key_cb);
        m_ctl.create_sensor_manifold(obj, "ROT_RIGHT", m_ctl.CT_CONTINUOUS,
                [elapsed, key_right], key_double_logic, key_cb);
    }

    // mouse wheel: camera zooming and translation speed adjusting
    var dest_zoom_mouse = 0;
    var mouse_wheel = m_ctl.create_mouse_wheel_sensor();
    var mouse_wheel_cb = function(obj, id, value, pulse) {
        if (pulse == 1) {
            if (use_pivot) {
                // camera zooming
                var cam_pivot = _vec3_tmp;
                var cam_eye = m_cam.get_eye(obj);
                m_cam.get_pivot(obj, cam_pivot);
                var dist = m_vec3.dist(cam_pivot, cam_eye);
                var t_mult = -value * dist * MOUSE_ZOOM_FACTOR * trans_speed;
                dest_zoom_mouse += t_mult;
            } else {
                // translation speed adjusting
                var factor = value * zoom_speed;
                var camera = m_scs.get_active_camera();
                m_cam.change_trans_speed(camera, factor);
            }
        }
    }
    m_ctl.create_sensor_manifold(obj, "MOUSE_WHEEL", m_ctl.CT_LEVEL, 
            [mouse_wheel], null, mouse_wheel_cb);


    // camera zooming with touch
    var dest_zoom_touch = 0;
    var touch_zoom = m_ctl.create_touch_zoom_sensor();
    var touch_zoom_cb = function(obj, id, value, pulse, param) {
        if (pulse == 1) {
            if (use_pivot) {
                var cam_pivot = _vec3_tmp;
                var cam_eye = m_cam.get_eye(obj);
                m_cam.get_pivot(obj, cam_pivot);
                var dist = m_vec3.dist(cam_pivot, cam_eye);
                var t_mult = -value * dist * TOUCH_ZOOM_FACTOR * trans_speed;
                dest_zoom_touch += t_mult;
            }
        }
    }
    m_ctl.create_sensor_manifold(obj, "TOUCH_ZOOM", m_ctl.CT_LEVEL, 
            [touch_zoom], null, touch_zoom_cb);


    // camera zoom smoothing
    var zoom_interp_cb = function(obj, id, value, pulse) {

        if (pulse == 1 && (Math.abs(dest_zoom_mouse) > 0.001 ||
                           Math.abs(dest_zoom_touch) > 0.001)
                       && use_pivot) {

            var zoom_mouse = m_util.smooth(dest_zoom_mouse, 0, value, CAM_SMOOTH_ZOOM_MOUSE);
            dest_zoom_mouse -= zoom_mouse;

            var zoom_touch = m_util.smooth(dest_zoom_touch, 0, value, CAM_SMOOTH_ZOOM_TOUCH);
            dest_zoom_touch -= zoom_touch;

            m_trans.move_local(obj, 0, zoom_mouse + zoom_touch, 0);
        }
    }
    m_ctl.create_sensor_manifold(obj, "ZOOM_INTERPOL", m_ctl.CT_CONTINUOUS,
            [elapsed], null, zoom_interp_cb);


    // camera rotation with mouse 
    var dest_x_mouse = 0;
    var dest_y_mouse = 0;

    var mouse_move_x = m_ctl.create_mouse_move_sensor("X");
    var mouse_move_y = m_ctl.create_mouse_move_sensor("Y");
    var mouse_down = m_ctl.create_mouse_click_sensor();

    var mouse_cb = function(obj, id, value, pulse, param) {
        if (pulse == 1) {
            if (use_pivot) {
                var r_mult = MOUSE_ROTATION_MULT_PX * rot_speed;

                dest_x_mouse += (param == "X") ? -value * r_mult : 0;
                dest_y_mouse += (param == "Y") ? -value * r_mult : 0;
            }
        }
    }

    m_ctl.create_sensor_manifold(obj, "MOUSE_X", m_ctl.CT_LEVEL,
            [mouse_move_x, mouse_down], null, mouse_cb, "X");
    m_ctl.create_sensor_manifold(obj, "MOUSE_Y", m_ctl.CT_LEVEL,
            [mouse_move_y, mouse_down], null, mouse_cb, "Y");


    // camera rotation with touch 
    var dest_x_touch = 0;
    var dest_y_touch = 0;

    var touch_move_x = m_ctl.create_touch_move_sensor("X");
    var touch_move_y = m_ctl.create_touch_move_sensor("Y");

    var touch_cb = function(obj, id, value, pulse, param) {
        if (pulse == 1) {
            if (use_pivot) {
                var r_mult = TOUCH_ROTATION_MULT_PX * rot_speed;

                dest_x_touch += (param == "X") ? -value * r_mult : 0;
                dest_y_touch += (param == "Y") ? -value * r_mult : 0;
            }
        }
    }

    m_ctl.create_sensor_manifold(obj, "TOUCH_X", m_ctl.CT_LEVEL, 
            [touch_move_x], null, touch_cb, "X");
    m_ctl.create_sensor_manifold(obj, "TOUCH_Y", m_ctl.CT_LEVEL, 
            [touch_move_y], null, touch_cb, "Y");

    // camera rotation smoothing
    var rot_interp_cb = function(obj, id, value, pulse) {

        if (pulse == 1 && (Math.abs(dest_x_mouse) > 0.001 ||
                           Math.abs(dest_y_mouse) > 0.001 ||
                           Math.abs(dest_x_touch) > 0.001 ||
                           Math.abs(dest_y_touch) > 0.001)
                       && use_pivot) {

            var x_mouse = m_util.smooth(dest_x_mouse, 0, value, CAM_SMOOTH_ROT_MOUSE);
            var y_mouse = m_util.smooth(dest_y_mouse, 0, value, CAM_SMOOTH_ROT_MOUSE);

            dest_x_mouse -= x_mouse;
            dest_y_mouse -= y_mouse;

            var x_touch = m_util.smooth(dest_x_touch, 0, value, CAM_SMOOTH_ROT_TOUCH);
            var y_touch = m_util.smooth(dest_y_touch, 0, value, CAM_SMOOTH_ROT_TOUCH);

            dest_x_touch -= x_touch;
            dest_y_touch -= y_touch;

            m_cam.rotate_pivot(obj, x_mouse + x_touch, y_mouse + y_touch);
        }
    }
    m_ctl.create_sensor_manifold(obj, "ROT_INTERPOL", m_ctl.CT_CONTINUOUS,
            [elapsed], null, rot_interp_cb);


    // some additinal controls
    m_ctl.create_kb_sensor_manifold(obj, "TOGGLE_CAMERA_COLLISION", m_ctl.CT_SHOT, 
            m_ctl.KEY_C, function() {toggle_camera_collisions_usage();});

    m_ctl.create_kb_sensor_manifold(obj, "DEC_STEREO_DIST", m_ctl.CT_SHOT, 
            m_ctl.KEY_LEFT_SQ_BRACKET, function(obj, id, value, pulse) {
                var dist = m_cam.get_stereo_distance(obj);
                m_cam.set_stereo_distance(obj, 0.9 * dist);
            });

    m_ctl.create_kb_sensor_manifold(obj, "INC_STEREO_DIST", m_ctl.CT_SHOT, 
            m_ctl.KEY_RIGHT_SQ_BRACKET, function(obj, id, value, pulse) {
                var dist = m_cam.get_stereo_distance(obj);
                m_cam.set_stereo_distance(obj, 1.1 * dist);
            });

}

exports.enable_object_controls = function(obj) {
    var trans_speed = 1;

    var is_vehicle = m_phy.is_vehicle_chassis(obj) ||
            m_phy.is_vehicle_hull(obj);

    var key_cb = function(obj, id, value, pulse) {
        if (pulse == 1) {
            var elapsed = value;

            switch (id) {
            case "FORWARD":
                if (is_vehicle)
                    m_phy.vehicle_throttle(obj, 1);
                else
                    m_trans.move_local(obj, 0, 0, trans_speed * elapsed);
                break;
            case "BACKWARD":
                if (is_vehicle)
                    m_phy.vehicle_throttle(obj, -1);
                else
                    m_trans.move_local(obj, 0, 0, -trans_speed * elapsed);
                break;
            case "LEFT":
                if (is_vehicle)
                    m_phy.vehicle_steer(obj, -1);
                else
                    m_trans.move_local(obj, trans_speed * elapsed, 0, 0);
                break;
            case "RIGHT":
                if (is_vehicle)
                    m_phy.vehicle_steer(obj, 1);
                else
                    m_trans.move_local(obj, -trans_speed * elapsed, 0, 0);
                break;
            default:
                break;
            }
        } else {
            switch (id) {
            case "FORWARD":
            case "BACKWARD":
                if (is_vehicle)
                    m_phy.vehicle_throttle(obj, 0);
                break;
            case "LEFT":
            case "RIGHT":
                if (is_vehicle)
                    m_phy.vehicle_steer(obj, 0);
                break;
            default:
                break;
            }
        }
    }

    var elapsed = m_ctl.create_elapsed_sensor();

    var key_w = m_ctl.create_keyboard_sensor(m_ctl.KEY_W);
    var key_s = m_ctl.create_keyboard_sensor(m_ctl.KEY_S);
    var key_a = m_ctl.create_keyboard_sensor(m_ctl.KEY_A);
    var key_d = m_ctl.create_keyboard_sensor(m_ctl.KEY_D);

    var key_up = m_ctl.create_keyboard_sensor(m_ctl.KEY_UP);
    var key_down = m_ctl.create_keyboard_sensor(m_ctl.KEY_DOWN);
    var key_left = m_ctl.create_keyboard_sensor(m_ctl.KEY_LEFT);
    var key_right = m_ctl.create_keyboard_sensor(m_ctl.KEY_RIGHT);

    var key_logic = function(s) {
        return s[0] && (s[1] || s[2]);
    }

    m_ctl.create_sensor_manifold(obj, "FORWARD", m_ctl.CT_CONTINUOUS, 
            [elapsed, key_w, key_up], key_logic, key_cb);
    m_ctl.create_sensor_manifold(obj, "BACKWARD", m_ctl.CT_CONTINUOUS,
            [elapsed, key_s, key_down], key_logic, key_cb);
    m_ctl.create_sensor_manifold(obj, "LEFT", m_ctl.CT_CONTINUOUS, 
            [elapsed, key_a, key_left], key_logic, key_cb);
    m_ctl.create_sensor_manifold(obj, "RIGHT", m_ctl.CT_CONTINUOUS,
            [elapsed, key_d, key_right], key_logic, key_cb);
}

/**
 * Works for camera too
 */
exports.disable_object_controls = function(obj) {
    m_ctl.remove_sensor_manifolds(obj);
}

/**
 * Enable engine controls.
 * Execute before using any of m_ctl.*() function
 * @param canvas_elem Canvas element
 */
exports.enable_controls = function(canvas_elem) {
    document.addEventListener("keydown", m_ctl.keydown_cb, false);
    document.addEventListener("keyup", m_ctl.keyup_cb, false);

    // NOTE: both are deprecated by feature WheelEvent
    canvas_elem.addEventListener("mousewheel",     m_ctl.mouse_wheel_cb, false); // chrome
    canvas_elem.addEventListener("DOMMouseScroll", m_ctl.mouse_wheel_cb, false); // firefox
 
    // NOTE: register for body, while pointer lock also assign on body
    document.body.addEventListener("mousedown", m_ctl.mouse_down_cb, false);
    document.body.addEventListener("mouseup",   m_ctl.mouse_up_cb,   false);
    
    // NOTE: register for canvas to prevent panel issues in viewer
    canvas_elem.addEventListener("mousemove", m_ctl.mouse_move_cb, false);
    canvas_elem.addEventListener("touchstart", m_ctl.touch_start_cb, false);
    canvas_elem.addEventListener("touchmove", m_ctl.touch_move_cb, false);
}
/**
 * Disable engine controls.
 * @param canvas_elem Canvas element
 */
exports.disable_controls = function(canvas_elem) {
    document.removeEventListener("keydown", m_ctl.keydown_cb, false);
    document.removeEventListener("keyup", m_ctl.keyup_cb, false);

    // NOTE: both are deprecated by feature WheelEvent
    canvas_elem.removeEventListener("mousewheel",     m_ctl.mouse_wheel_cb, false); // chrome
    canvas_elem.removeEventListener("DOMMouseScroll", m_ctl.mouse_wheel_cb, false); // firefox
    // NOTE: use document.body (canvas events disabled in fullscreen mode)
    document.body.removeEventListener("mousedown", m_ctl.mouse_down_cb, false);
    document.body.removeEventListener("mouseup",   m_ctl.mouse_up_cb, false);

    canvas_elem.removeEventListener("mousemove", m_ctl.mouse_move_cb, false);
    canvas_elem.removeEventListener("touchstart", m_ctl.touch_start_cb, false);
    canvas_elem.removeEventListener("touchmove", m_ctl.touch_move_cb, false);
}

/**
 * Enable debug controls.
 * K - make camera debug shot
 * L - make light debug shot
 * M - flashback messages
 */
exports.enable_debug_controls = function() {

    var obj = m_scs.get_active_camera();

    m_ctl.create_kb_sensor_manifold(obj, "CAMERA_SHOT", m_ctl.CT_SHOT, 
            m_ctl.KEY_K, function() {m_dbg.make_camera_frustum_shot();});

    m_ctl.create_kb_sensor_manifold(obj, "LIGHT_SHOT", m_ctl.CT_SHOT, 
            m_ctl.KEY_L, function() {m_dbg.make_light_frustum_shot();});

    m_ctl.create_kb_sensor_manifold(obj, "TELEMETRY", m_ctl.CT_SHOT, 
            m_ctl.KEY_T, function() {m_dbg.plot_telemetry();});
}

exports.request_fullscreen = request_fullscreen;
/**
 * Request fullscreen mode.
 * Security issues: execute by user event.
 * @methodOf app
 * @param elem Element
 * @param enabled_cb Enabled callback
 * @param disabled_cb Disabled callback
 */
function request_fullscreen(elem, enabled_cb, disabled_cb) {

    enabled_cb = enabled_cb || function() {};
    disabled_cb = disabled_cb || function() {};

    function on_fullscreen_change() {
        if (document.fullscreenElement === elem ||
                document.webkitFullScreenElement === elem ||
                document.mozFullScreenElement === elem || document.webkitIsFullScreen) {
            //m_print.log("Fullscreen enabled");
            enabled_cb();
        } else {
            document.removeEventListener("fullscreenchange",
                    on_fullscreen_change, false);
            document.removeEventListener("webkitfullscreenchange",
                    on_fullscreen_change, false);
            document.removeEventListener("mozfullscreenchange",
                    on_fullscreen_change, false);
            //m_print.log("Fullscreen disabled");
            disabled_cb();
        }
    }

    document.addEventListener("fullscreenchange", on_fullscreen_change, false);
    document.addEventListener("webkitfullscreenchange", on_fullscreen_change, false);
    document.addEventListener("mozfullscreenchange", on_fullscreen_change, false);
  
    elem.requestFullScreen = elem.requestFullScreen ||
            elem.webkitRequestFullScreen || elem.mozRequestFullScreen;
 
    if (elem.requestFullScreen == elem.webkitRequestFullScreen)
        elem.requestFullScreen(Element.ALLOW_KEYBOARD_INPUT);
    else
        elem.requestFullScreen();
}

exports.exit_fullscreen = exit_fullscreen;
/**
 * Exit fullscreen mode.
 * @methodOf app
 */
function exit_fullscreen() {

    var exit_fs = document.exitFullscreen || document.webkitExitFullscreen || 
            document.mozCancelFullScreen;

    if (typeof exit_fs != "function")
        throw "B4W App: exit fullscreen method is not supported";

    exit_fs.apply(document);
}

function toggle_camera_collisions_usage() {
    var camobj = m_scs.get_active_camera();

    if (m_anim.is_detect_collisions_used(camobj)) {
        m_anim.detect_collisions(camobj, false);
    } else {
        m_anim.detect_collisions(camobj, true);
    }
}

function alert_web(text_message, link_message, link) {
    
    var elem = document.createElement("div");
    var top_border_elem = document.createElement("div");
    var bottom_border_elem = document.createElement("div");
    var bottom_conteiner_elem = document.createElement("div");
    var logo_elem = document.createElement("div");

    elem.style.cssText = "z-index:10;width:100%;height:100%;position:absolute;"
    bottom_conteiner_elem.style.cssText = "position:absolute;bottom:0;width:100%;height:auto;";
    logo_elem.style.cssText = "position:relative;float:right;margin:20px;width:70px;height:70px;background-image:url('data:image/png;base64,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')";
    top_border_elem.style.cssText = "position:relative;top:0;width:100%;background-color:#000;opacity:0.6;height:auto;color:#ffd42a;text-align:center;font-size:32px;padding:10px 0;";
    bottom_border_elem.style.cssText = "position:relative;clear:both;bottom:0;width:100%;background-color:#000;opacity:0.6;height:auto;color:#fff;text-align:center;font-size:20px;padding:10px 0;";

    top_border_elem.innerHTML = text_message;
    bottom_border_elem.innerHTML = link_message + '   ' + '<a style="color:#ffd42a;font-size:20px;width:100%;" href="' + link + '">'+link+'</a>';

    bottom_conteiner_elem.appendChild(logo_elem);
    bottom_conteiner_elem.appendChild(bottom_border_elem);

    elem.appendChild(top_border_elem);
    elem.appendChild(bottom_conteiner_elem);

    document.body.appendChild(elem);
}

/** 
 * Retrieve params object from URL or null.
 */
exports.get_url_params = function() {

    var url = location.href.toString();
    if (url.indexOf("?") == -1)
        return null;

    var params = url.split("?")[1].split("&");

    var out = {};

    for (var i = 0; i < params.length; i++) {
        var param = params[i].split("=");
        out[param[0]] = param[1];
    }

    return out;
}


}

if (window["b4w"])
    window["b4w"]["app"] = b4w.require("app");
else
    throw "Failed to register app, load b4w first";