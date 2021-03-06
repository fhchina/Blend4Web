"use strict";

/**
 * Scene API.
 * Almost every routine requires an active scene to be set,
 * use get_active() set_active() to do that.
 * @module scenes
 */
b4w.module["scenes"] = function(exports, require) {

var m_batch     = require("__batch");
var m_cam       = require("__camera");
var m_graph     = require("__graph");
var m_obj       = require("__objects");
var m_print     = require("__print");
var physics     = require("__physics");
var m_scenes    = require("__scenes");
var m_util      = require("__util");

/**
 * All possible data IDs.
 * @const module:scenes.DATA_ID_ALL
 */
exports.DATA_ID_ALL   = m_scenes.DATA_ID_ALL;

/* subscene types for different aspects of processing */

// need light update
var LIGHT_SUBSCENE_TYPES = ["MAIN_OPAQUE", "MAIN_BLEND", "MAIN_REFLECT",
        "GOD_RAYS", "SKY"];

/**
 * Set the active scene
 * @method module:scenes.set_active
 * @param {String} scene_name Name of scene
 */
exports.set_active = function(scene_name) {
    // NOTE: keysearch is dangerous
    var scenes = m_scenes.get_all_scenes();
    m_scenes.set_active(m_util.keysearch("name", scene_name, scenes));
}

/**
 * Get the current active scene
 * @method module:scenes.get_active
 * @returns {String} Active scene name
 */
exports.get_active = function() {
    if (!m_scenes.check_active())
        return "";
    else
        return m_scenes.get_active()["name"];
}
/**
 * Get all scene names.
 * @method module:scenes.get_scenes
 * @returns {Array} Array of scene names
 */
exports.get_scenes = function() {
    var scenes = m_scenes.get_all_scenes();
    var scene_names = [];
    for (var i = 0; i < scenes.length; i++)
        scene_names.push(scenes[i]["name"]);

    return scene_names;
}
/**
 * Return the active camera object from the active scene
 * @method module:scenes.get_active_camera
 * @returns {Object} Camera object ID
 */
exports.get_active_camera = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    } else
        return m_scenes.get_camera(m_scenes.get_active());
}

/**
 * Get object by name.
 * @method module:scenes.get_object_by_name
 * @param {String} name Object name
 * @param {Number} [data_id=0] ID of loaded data
 * @returns {Object} Object ID
 */
exports.get_object_by_name = function(name, data_id) {
    return m_scenes.get_object(m_scenes.GET_OBJECT_BY_NAME, name,
            data_id | 0);
}

/**
 * Get object by empty name and dupli name.
 * @method module:scenes.get_object_by_dupli_name
 * @param {String} empty_name EMPTY object name
 * @param {String} dupli_name DUPLI object name
 * @param {Number} [data_id=0] ID of loaded data
 * @returns {Object} Object ID
 */
exports.get_object_by_dupli_name = function(empty_name, dupli_name,
        data_id) {
    return m_scenes.get_object(m_scenes.GET_OBJECT_BY_DUPLI_NAME, empty_name,
            dupli_name, data_id | 0);
}

/**
 * Get object by empty name and dupli name list.
 * @method module:scenes.get_object_by_dupli_name_list
 * @param {Array} name_list List of EMPTY and DUPLI object names
 * @param {Number} [data_id=0] ID of loaded data
 * @returns {Object} Object ID
 */
exports.get_object_by_dupli_name_list = function(name_list, data_id) {
    return m_scenes.get_object(m_scenes.GET_OBJECT_BY_DUPLI_NAME_LIST,
            name_list, data_id | 0);
}

/**
 * @method module:scenes.get_object_by_empty_name
 * @deprecated use scenes.get_object_by_dupli_name instead
 */
exports.get_object_by_empty_name = function(empty_name, dupli_name,
        data_id) {
    m_print.warn("get_object_by_empty_name() deprecated, use get_object_by_dupli_name() instead");
    return exports.get_object_by_dupli_name(empty_name, dupli_name, data_id);
}

/**
 * Returns object data_id property
 * @method module:scenes.get_object_data_id
 * @param {Object} obj Object ID
 * @returns {Number} data_id Data ID property
 */
exports.get_object_data_id = function(obj) {
    return m_scenes.get_object_data_id(obj);
}

/**
 * For given mouse coords, render the color scene and return an object
 * @method module:scenes.pick_object
 * @param x X screen coordinate
 * @param y Y screen coordinate
 */
exports.pick_object = m_scenes.pick_object;

/**
 * Set outline glow intensity for the object
 * @method module:scenes.set_glow_intensity
 * @param {Object} obj Object ID
 * @param {Number} value Intensity value
 */
exports.set_glow_intensity = function(obj, value) {
    for (var i = 0; i < obj._batches.length; i++) {
        var batch = obj._batches[i];

        if (batch.type == "COLOR_ID")
            batch.glow_intensity = value;
    }
}

/**
 * Apply glowing animation to the object
 * @method module:scenes.apply_glow_anim
 * @param {Object} obj Object ID
 * @param {Number} tau Glowing duration
 * @param {Number} T Period of glowing
 * @param {Number} N Number of relapses (0 - infinity)
 */
exports.apply_glow_anim = function(obj, tau, T, N) {
    if (obj._render && obj._render.selectable)
        m_scenes.apply_glow_anim(obj, tau, T, N);
}

/**
 * Apply glowing animation to the object and use the object's default settings
 * @method module:scenes.apply_glow_anim_def
 * @param {Object} obj Object ID
 */
exports.apply_glow_anim_def = function(obj) {
    if (obj._render && obj._render.selectable) {
        var ga = obj._render.glow_anim_settings;
        m_scenes.apply_glow_anim(obj, ga.glow_duration, ga.glow_period,
                ga.glow_relapses);
    }
}

/**
 * Stop glowing animation for the object.
 * @method module:scenes.clear_glow_anim
 * @param {Object} obj Object ID
 */
exports.clear_glow_anim = function(obj) {
    if (obj._render && obj._render.selectable)
        m_scenes.clear_glow_anim(obj);
}

/**
 * Set the color of glowing
 * @method module:scenes.set_glow_color
 * @param {Float32Array} color Color
 */
exports.set_glow_color = function(color) {
    var scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(scene, "GLOW");
    if (subs) {
        subs.glow_color.set(color);
        subs.need_perm_uniforms_update = true;
    }
}


/**
 * Get shadow params.
 * @method module:scenes.get_shadow_params
 * @returns {Object} Shadow params
 * @cc_externs enable_csm csm_num csm_first_cascade_border first_cascade_blur_radius
 * @cc_externs csm_last_cascade_border last_cascade_blur_radius csm_resolution
 * @cc_externs self_shadow_normal_offset self_shadow_polygon_offset
 * @cc_externs pcf_blur_radius fade_last_cascade blend_between_cascades
 * @cc_externs csm_borders blur_radii
 */
exports.get_shadow_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    var active_scene = m_scenes.get_active();
    var shadow_cast  = m_scenes.get_subs(active_scene, "SHADOW_CAST");

    if (!shadow_cast)
        return null;

    var shs = active_scene._render.shadow_params;
    var subs_main = m_scenes.get_subs(active_scene, "MAIN_OPAQUE");
    var subs_depth = m_scenes.get_subs(active_scene, "DEPTH");

    var shadow_params = {};
    shadow_params.csm_resolution = shs.csm_resolution;

    shadow_params.self_shadow_polygon_offset = shadow_cast.self_shadow_polygon_offset;
    if (subs_depth)
        shadow_params.self_shadow_normal_offset = subs_depth.self_shadow_normal_offset;

    shadow_params.enable_csm = shs.enable_csm;
    shadow_params.csm_num = shs.csm_num;
    shadow_params.csm_first_cascade_border = shs.csm_first_cascade_border;
    shadow_params.first_cascade_blur_radius = shs.first_cascade_blur_radius;
    shadow_params.csm_last_cascade_border = shs.csm_last_cascade_border;
    shadow_params.last_cascade_blur_radius = shs.last_cascade_blur_radius;

    shadow_params.fade_last_cascade = shs.fade_last_cascade;
    shadow_params.blend_between_cascades = shs.blend_between_cascades;

    if (shs.enable_csm) {
        shadow_params.csm_borders = m_scenes.get_csm_borders(active_scene,
                subs_main.camera);
        shadow_params.blur_radii = new Float32Array(shs.csm_num);
        shadow_params.blur_radii.set(subs_main.camera.pcf_blur_radii.subarray(0,
                shs.csm_num));
    } else {
        shadow_params.csm_borders = null;
        shadow_params.blur_radii = null;
    }


    return shadow_params;
}

/**
 * Set shadow params
 * @method module:scenes.set_shadow_params
 * @param {Object} shadow_params Shadow params
 */
exports.set_shadow_params = function(shadow_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    var active_scene = m_scenes.get_active();

    if (typeof shadow_params.self_shadow_polygon_offset == "number")
        m_graph.traverse(active_scene._render.graph, function(node, attr) {
            if (attr.type === "SHADOW_CAST")
                attr.self_shadow_polygon_offset = shadow_params.self_shadow_polygon_offset;
        });

    var subs_depth = m_scenes.get_subs(active_scene, "DEPTH");
    if (subs_depth) {
        if (typeof shadow_params.self_shadow_normal_offset == "number")
            subs_depth.self_shadow_normal_offset = shadow_params.self_shadow_normal_offset;
        if (typeof shadow_params.pcf_blur_radius == "number")
            subs_depth.pcf_blur_radius = shadow_params.pcf_blur_radius;
    }

    var subs_main_blend = m_scenes.get_subs(active_scene, "MAIN_BLEND");
    if (subs_main_blend) {
        if (typeof shadow_params.self_shadow_normal_offset == "number")
            subs_main_blend.self_shadow_normal_offset = shadow_params.self_shadow_normal_offset;
        if (typeof shadow_params.pcf_blur_radius == "number")
            subs_main_blend.pcf_blur_radius = shadow_params.pcf_blur_radius;

        subs_main_blend.need_perm_uniforms_update = true;
    }

    var shs = active_scene._render.shadow_params;
    if (typeof shadow_params.csm_first_cascade_border == "number")
        shs.csm_first_cascade_border = shadow_params.csm_first_cascade_border;
    if (typeof shadow_params.first_cascade_blur_radius == "number")
        shs.first_cascade_blur_radius = shadow_params.first_cascade_blur_radius;
    if (typeof shadow_params.csm_last_cascade_border == "number")
        shs.csm_last_cascade_border = shadow_params.csm_last_cascade_border;
    if (typeof shadow_params.last_cascade_blur_radius == "number")
        shs.last_cascade_blur_radius = shadow_params.last_cascade_blur_radius;

    // update directives; only depth subs supported
    if (subs_depth) {
        var bundles = subs_depth.bundles;

        for (var i = 0; i < bundles.length; i++) {

            var bundle = bundles[i];

            if (!bundle.obj_render.shadow_receive)
                continue;

            var batch = bundle.batch;
            m_batch.assign_shadow_receive_dirs(batch, shs);

            m_batch.update_shader(batch);
        }
        subs_depth.need_perm_uniforms_update = true;
    }

    var upd_cameras = active_scene["camera"]._render.cameras;
    for (var i = 0; i < upd_cameras.length; i++)
        m_cam.update_camera_shadows(upd_cameras[i], shs);

    m_scenes.schedule_shadow_update(active_scene);
}

/**
 * Get horizon and zenith colors of the environment.
 * @method module:scenes.get_environment_colors
 * @returns {Array} Environment colors
 */
exports.get_environment_colors = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_environment_colors(active_scene);
}

/**
 * Set horizon and/or zenith color(s) of the environment.
 * @method module:scenes.set_environment_colors
 * @param {Number} [opt_environment_energy] Environment Energy
 * @param {Float32Array} [opt_horizon_color] Horizon color
 * @param {Float32Array} [opt_zenith_color] Zenith color
 */
exports.set_environment_colors = function(opt_environment_energy,
        opt_horizon_color, opt_zenith_color) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_environment_colors(active_scene,
            parseFloat(opt_environment_energy), opt_horizon_color,
            opt_zenith_color);
}

/**
 * Get fog color and density.
 * @method module:scenes.get_fog_color_density
 * @param {Float32Array} dest Destnation vector [C,C,C,D]
 * @returns {Float32Array} Destnation vector
 */
exports.get_fog_color_density = function(dest) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_fog_color_density(active_scene, dest);
}

/**
 * Set fog color and density
 * @method module:scenes.set_fog_color_density
 * @param {Float32Array} val Color-density vector [C,C,C,D]
 */
exports.set_fog_color_density = function(val) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_fog_color_density(active_scene, val);
}

/**
 * Get SSAO params
 * @method module:scenes.get_ssao_params
 * @returns {Object} SSAO params
 */
exports.get_ssao_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_ssao_params(active_scene);
}

/**
 * Set SSAO params
 * @method module:scenes.set_ssao_params
 * @param {Object} ssao_params SSAO params
 * @cc_externs ssao_quality radius_increase ssao_hemisphere
 * @cc_externs ssao_blur_depth ssao_blur_discard_value
 * @cc_externs influence dist_factor ssao_white ssao_only
 */
exports.set_ssao_params = function(ssao_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_ssao_params(active_scene, ssao_params);
}

/**
 * Get color correction params
 * @method module:scenes.get_color_correction_params
 * @returns {Object} Color correction params
 * @cc_externs brightness contrast exposure saturation
 */
exports.get_color_correction_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return null;
    }

    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene, "COMPOSITING");
    if (!subs)
        return null;

    var compos_params = {};

    compos_params.brightness = subs.brightness;
    compos_params.contrast = subs.contrast;
    compos_params.exposure = subs.exposure;
    compos_params.saturation = subs.saturation;

    return compos_params;
}

/**
 * Set color correction params
 * @method module:scenes.set_color_correction_params
 * @param {Object} Color correction params
 */
exports.set_color_correction_params = function(compos_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return null;
    }

    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene, "COMPOSITING");
    if (!subs)
        return null;

    if (typeof compos_params.brightness == "number")
        subs.brightness = compos_params.brightness;

    if (typeof compos_params.contrast == "number")
        subs.contrast = compos_params.contrast;

    if (typeof compos_params.exposure == "number")
        subs.exposure = compos_params.exposure;

    if (typeof compos_params.saturation == "number")
        subs.saturation = compos_params.saturation;

    subs.need_perm_uniforms_update = true;
}

/**
 * Get sky params
 * @method module:scenes.get_sky_params
 * @returns {Object} Sky params
 */
exports.get_sky_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    return m_scenes.get_sky_params(active_scene);
}

/**
 * Set sky params
 * @method module:scenes.set_sky_params
 * @param {Object} sky_params Sky params
 * @cc_externs procedural_skydome use_as_environment_lighting
 * @cc_externs rayleigh_brightness mie_brightness spot_brightness
 * @cc_externs scatter_strength rayleigh_strength mie_strength
 * @cc_externs rayleigh_collection_power mie_collection_power
 * @cc_externs mie_distribution color
 */
exports.set_sky_params = function(sky_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_sky_params(active_scene, sky_params);
}

/**
 * Get depth-of-field (DOF) params.
 * @method module:scenes.get_dof_params
 * @returns {Object} DOF params
 */
exports.get_dof_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene,"DOF");
    if (subs)
        return m_scenes.get_dof_params(active_scene);
    else
        return null;
}

/**
 * Set depth-of-field (DOF) params
 * @method module:scenes.set_dof_params
 * @param {Object} DOF params
 * @cc_externs dof_on dof_distance dof_front dof_rear dof_power
 */
exports.set_dof_params = function(dof_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_dof_params(active_scene, dof_params);
}

/**
 * Get god rays parameters
 * @method module:scenes.get_god_rays_params
 * @returns {Object} god rays parameters
 */
exports.get_god_rays_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene,"GOD_RAYS");
    if (subs)
        return m_scenes.get_god_rays_params(active_scene);
    else
        return null;
}

/**
 * Set god rays parameters
 * @method module:scenes.set_god_rays_params
 * @param {Object} god rays params
 * @cc_externs god_rays_max_ray_length god_rays_intensity god_rays_steps
 */
exports.set_god_rays_params = function(god_rays_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_god_rays_params(active_scene, god_rays_params);
}

/**
 * Get bloom parameters
 * @method module:scenes.get_bloom_params
 * @returns {Object} bloom parameters
 */
exports.get_bloom_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    var subs = m_scenes.get_subs(active_scene,"BLOOM");
    if (subs)
        return m_scenes.get_bloom_params(active_scene);
    else
        return null;
}

/**
 * Set bloom parameters
 * @method module:scenes.set_bloom_params
 * @param {Object} bloom params
 * @cc_externs bloom_key bloom_edge_lum bloom_blur
 */
exports.set_bloom_params = function(bloom_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_bloom_params(active_scene, bloom_params);
}

/**
 * Get wind parameters
 * @method module:scenes.get_wind_params
 * @returns {Object} Wind params
 */
exports.get_wind_params = function() {
    return m_scenes.get_wind_params();
}

/**
 * Set wind parameters
 * @method module:scenes.set_wind_params
 * @param {Object} wind params
 * @cc_externs wind_dir wind_strength
 */
exports.set_wind_params = function(wind_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_wind_params(active_scene, wind_params);
}

/**
 * Get water surface level.
 * @method module:scenes.get_water_surface_level
 * @returns {Number} surface level
 */
exports.get_water_surface_level = m_scenes.get_water_surface_level;

/**
 * Set water params
 * @method module:scenes.set_water_params
 * @param {Object} water params
 * @cc_externs waves_height waves_length water_fog_density water_fog_color
 * @cc_externs dst_noise_scale0 dst_noise_scale1 dst_noise_freq0 dst_noise_freq1
 * @cc_externs dir_min_shore_fac dir_freq dir_noise_scale dir_noise_freq
 * @cc_externs dir_min_noise_fac dst_min_fac waves_hor_fac water_dynamic
 */
exports.set_water_params = function(water_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.set_water_params(active_scene, water_params);
}

/**
 * Get water material parameters
 * @method module:scenes.get_water_mat_params
 * @param {Object} water params
 */
exports.get_water_mat_params = function(water_params) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.get_water_mat_params(active_scene, water_params);
}

/**
 * Update scene materials parameters
 * @method module:scenes.update_scene_materials_params
 */
exports.update_scene_materials_params = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }
    var active_scene = m_scenes.get_active();
    m_scenes.update_scene_permanent_uniforms(active_scene);
}


/**
 * Hide object.
 * Supported only for dynamic meshes.
 * @method module:scenes.hide_object
 * @param {Object} obj Object ID
 */
exports.hide_object = function(obj) {
    if (m_obj.is_dynamic_mesh(obj))
        m_scenes.hide_object(obj);
    else
        m_print.error("B4W Error: show/hide is only supported for dynamic meshes");
}

/**
 * Show object.
 * Supported only for dynamic meshes.
 * @method module:scenes.show_object
 * @param {Object} obj Object ID
 */
exports.show_object = function(obj) {
    if (m_obj.is_dynamic_mesh(obj))
        m_scenes.show_object(obj);
    else
        m_print.error("B4W Error: show/hide is only supported for dynamic meshes");
}

/**
 * Check if object is visible.
 * @method module:scenes.is_visible
 * @param {Object} obj Object ID
 * @returns {Boolean} Check result
 */
exports.is_visible = function(obj) {
    return obj._render.is_visible;
}

/**
 * Check the object's availability in the active scene.
 * @method module:scenes.check_object
 * @param name Object name
 * @returns {Boolean} Check result
 */
exports.check_object = function(obj) {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    return m_scenes.check_object(obj, m_scenes.get_active());
}

/**
 * Get all objects from the active scene.
 * @method module:scenes.get_all_objects
 * @param {String} [type="ALL"] Type
 * @param {Number} [data_id=DATA_ID_ALL] Objects data id
 * @returns {Array} Array with object IDs
 */
exports.get_all_objects = function(type, data_id) {
    var scene = m_scenes.get_active();

    if (!type)
        type = "ALL";

    if (!data_id && data_id !== 0)
        data_id = m_scenes.DATA_ID_ALL;

    return m_scenes.get_scene_objs(scene, type, data_id);
}

/**
 * Get objects appended to the active scene.
 * @method module:scenes.get_appended_objs
 * @param {String} [type] Type
 * @param {Number} [data_id] Objects data id
 * @deprecated use scenes.get_all_objects instead
 */
exports.get_appended_objs = function(type, data_id) {
    m_print.warn("get_appended_objs() deprecated, use get_all_objects() instead");
    return exports.get_all_objects(type, data_id);
}

/**
 * Get the object's name.
 * @method module:scenes.get_object_name
 * @param {Object} obj Object ID
 * @returns {String} Object name
 */
exports.get_object_name = function(obj) {
    if (!obj) {
        m_print.error("Wrong object name");
        return "";
    }

    return obj["name"];
}

/**
 * Get the object's type.
 * @method module:scenes.get_object_type
 * @param {Object} obj Object ID
 * @return {String} Object type
 */
exports.get_object_type = function(obj) {
    if (!(obj && obj["type"])) {
        m_print.error("Wrong object ID");
        return "UNDEFINED";
    }

    return obj["type"];
}

/**
 * Return the object's parent.
 * @method module:scenes.get_object_dg_parent
 * @param {Object} obj Object ID
 * @returns {Object} Object ID of parent object
 */
exports.get_object_dg_parent = function(obj) {
    return obj._dg_parent;
}

/**
 * Return the object's children.
 * @method module:scenes.get_object_children
 * @param {Object} obj Object ID
 * @returns {Array} Array of children object IDs
 */
exports.get_object_children = function(obj) {
    return obj._descends.slice(0);
}

/**
 * Find the first character on the active scene.
 * @method module:scenes.get_first_character
 * @returns {Object} Character object ID
 */
exports.get_first_character = function() {
    var sobjs = m_scenes.get_scene_objs(m_scenes.get_active(), "MESH",
            m_scenes.DATA_ID_ALL);
    for (var i = 0; i < sobjs.length; i++) {
        var obj = sobjs[i];
        if (physics.is_character(obj)) {
            return obj;
        }
    }
    return null;
}

/**
 * Return the distance to the shore line.
 * @method module:scenes.get_shore_dist
 * @param {Float32Array} trans Current translation
 * @param {Number} [v_dist_mult=1] Vertical distance multiplier
 * @returns {Number} Distance
 */
exports.get_shore_dist = function(trans, v_dist_mult) {
    if (!v_dist_mult && v_dist_mult !== 0)
        v_dist_mult = 1;

    return m_scenes.get_shore_dist(trans, v_dist_mult);
}

/**
 * Return the camera water depth or null if there is no water.
 * @method module:scenes.get_cam_water_depth
 * @returns {Number} Depth
 */
exports.get_cam_water_depth = function() {
    return m_scenes.get_cam_water_depth();
}

/**
 * Return type of mesh object or null.
 * @method module:scenes.get_type_mesh_object
 * @param {Object} obj Object ID
 * @returns {String} Render type: "DYNAMIC" or "STATIC"
 */
exports.get_type_mesh_object = function(obj) {
    if (obj["type"] == "MESH")
        return obj._render.type;
    return null;
}

/**
 * @typedef SceneMetaTags
 * @type {Object}
 * @property {String} title The title meta tag.
 * @property {String} description The description meta tag.
 */

/**
 * Get the Blender-assigned meta tags from the active scene.
 * @method module:scenes.get_meta_tags
 * @returns {SceneMetaTags} Scene meta tags
 * @cc_externs title description
 */
exports.get_meta_tags = function() {
    if (!m_scenes.check_active()) {
        m_print.error("No active scene");
        return false;
    }

    var active_scene = m_scenes.get_active();

    return m_scenes.get_meta_tags(active_scene);
}


// DEPRECATED

exports.append_object = function(obj) {
    m_util.panic("Method \"append_object\" is deprecated");
}
exports.add_object = function(obj) {
    m_util.panic("Method \"add_object\" is deprecated");
}
exports.remove_object = function(obj) {
    m_util.panic("Method \"remove_object\" is deprecated");
}
exports.get_screen_scenes = function() {
    m_util.panic("get_screen_scenes() deprecated");
}
exports.set_light_pos = function() {
    m_util.panic("set_light_pos() deprecated, use lights module instead");
}
exports.set_light_direction = function() {
    m_util.panic("set_light_direction() deprecated, use lights module instead");
}
exports.set_dir_light_color = function(index, val) {
    m_util.panic("set_dir_light_color() deprecated, use lights module instead");
}
exports.get_lights_names = function() {
    m_util.panic("get_lights_names() deprecated, use lights module instead");
}
exports.remove_all = function() {
    m_util.panic("remove_all() deprecated, use lights module instead");
}
exports.check_collision = function() {
    m_util.panic("check_collision() deprecated, use lights module instead");
}
exports.check_ray_hit = function() {
    m_util.panic("check_ray_hit() deprecated, use lights module instead");
}


}
