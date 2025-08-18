#!/usr/bin/env python3
# Blender helper: create reference scene, ensure shape keys on selected mesh,
# load front photo and viseme reference images from the repo, place a simple
# head template, and provide a one-click glTF export with shape keys.

# Usage (GUI):
# 1) Open Blender → Scripting tab → Open this file → Run Script
# 2) Select your head mesh object in the Outliner or 3D View OR let the script
#    create a simple "ReferenceHead" template if nothing is selected.
# 3) The script will:
#    - add A/E/I/MBP/FV/S shape keys to the active mesh
#    - load a front photo (kelly or ken) and place it to the left
#    - load viseme reference images in a neat grid to the right
#    - set an orthographic shaded view for clarity
# 4) To export GLB with shape keys, run the script again and enter:
#    export_glb('kelly') or export_glb('ken') in the Python console, or call
#    File → Export → glTF 2.0 with Shape Keys toggled.

# Usage (CLI): blender -P setup_reference_shape_keys.py -- --active-only

import bpy
import os
import sys

REPO_ROOT = "/Users/nicolette/ilearn_how"

KELLY_VISEME_DIR = os.path.join(REPO_ROOT, "production-deploy/assets/avatars/kelly/2d/full")
KEN_VISEME_DIR = os.path.join(REPO_ROOT, "production-deploy/assets/avatars/ken/2d/full")

# Front photo candidates (ordered by quality preference)
KELLY_FRONT_CANDIDATES = [
    os.path.join(REPO_ROOT, "production-deploy/assets/avatars/kelly/optimized/base-states/kelly_neutral_default.png"),
    os.path.join(REPO_ROOT, "production-deploy/assets/avatars/kelly/kelly_neutral_default.png"),
    os.path.join(REPO_ROOT, "production-deploy/assets/avatars/kelly_wallpaper.png"),
]
KEN_FRONT_CANDIDATES = [
    os.path.join(REPO_ROOT, "production-deploy/assets/avatars/ken/ken_neutral_default.png"),
    os.path.join(REPO_ROOT, "production-deploy/assets/avatars/ken-close-up.jpg"),
]

VKEYS = ["A","E","I","MBP","FV","S"]

def ensure_collection(name: str):
    col = bpy.data.collections.get(name)
    if not col:
        col = bpy.data.collections.new(name)
        bpy.context.scene.collection.children.link(col)
    return col

def load_image_as_empty(image_path: str, name: str, location=(0,0,0)):
    try:
        img = bpy.data.images.load(image_path, check_existing=True)
    except Exception as e:
        print(f"[skip] cannot load image {image_path}: {e}")
        return None
    empty = bpy.data.objects.new(name, None)
    empty.empty_display_type = 'IMAGE'
    empty.empty_display_size = 1.6
    empty.location = location
    # attach image to empty
    empty.data = None
    empty.empty_image_offset = (0.5, 0.5)  # show from corner nicely
    try:
        empty.data = None
        empty.empty_image = img
    except Exception:
        # Fallback for versions without empty_image API
        pass
    return empty

def find_existing(obj_name: str):
    return bpy.data.objects.get(obj_name)

def spawn_front_photo(avatar: str = 'kelly'):
    col = ensure_collection("FrontPhoto")
    name = f"front_{avatar}"
    if find_existing(name):
        return
    paths = KELLY_FRONT_CANDIDATES if avatar.lower().startswith('kel') else KEN_FRONT_CANDIDATES
    img_path = next((p for p in paths if os.path.exists(p)), None)
    if not img_path:
        print(f"[info] no front photo found for {avatar}")
        return
    ob = load_image_as_empty(img_path, name, location=(-3.5, 0.0, 0.0))
    if ob:
        col.objects.link(ob)

def spawn_viseme_reference_grid():
    col = ensure_collection("VisemeRefs")
    # lay out a grid of reference images if present
    spacing_x, spacing_y = 2.0, 1.6
    positions = {
        "A": (0*spacing_x, 0*spacing_y, 0),
        "E": (1*spacing_x, 0*spacing_y, 0),
        "I": (2*spacing_x, 0*spacing_y, 0),
        "MBP": (0*spacing_x, -1*spacing_y, 0),
        "FV": (1*spacing_x, -1*spacing_y, 0),
        "S": (2*spacing_x, -1*spacing_y, 0),
    }
    pairs = [
        (KELLY_VISEME_DIR, "kelly_{}"),
        (KEN_VISEME_DIR, "ken_{}"),
    ]
    for base, pattern in pairs:
        if not os.path.isdir(base):
            print(f"[info] viseme dir missing: {base}")
            continue
        for key, loc in positions.items():
            stem = pattern.format(key)
            path = os.path.join(base, f"{stem}.png")
            if os.path.exists(path):
                # Offset grid to the right side
                pos = (loc[0] + 3.5, loc[1], loc[2])
                ob = load_image_as_empty(path, f"{stem}", location=pos)
                if ob:
                    col.objects.link(ob)

def ensure_shape_keys_on_active(names=VKEYS):
    obj = bpy.context.active_object
    if not obj or obj.type != 'MESH':
        print("[warn] Select a MESH object to add shape keys.")
        return
    if not obj.data.shape_keys:
        obj.shape_key_add(name="Basis")
    existing = {k.name for k in obj.data.shape_keys.key_blocks}
    for name in names:
        if name in existing:
            print(f"[ok] shape key exists: {name}")
            continue
        obj.shape_key_add(name=name)
        print(f"[add] shape key: {name}")

def ensure_reference_head_if_none():
    if bpy.context.active_object and bpy.context.active_object.type == 'MESH':
        return bpy.context.active_object
    ob = find_existing("ReferenceHead")
    if ob:
        bpy.context.view_layer.objects.active = ob
        return ob
    # Create a simple UV sphere as a placeholder head
    bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=32, radius=0.8, location=(0,0,0))
    ob = bpy.context.active_object
    ob.name = "ReferenceHead"
    # Slight scale on Y to mimic head profile
    ob.scale[1] = 0.9
    # Shade smooth
    bpy.ops.object.shade_smooth()
    return ob

def set_simple_view():
    # Make a basic front orthographic view for sculpting reference
    for area in bpy.context.screen.areas:
        if area.type == 'VIEW_3D':
            for space in area.spaces:
                if space.type == 'VIEW_3D':
                    space.region_3d.view_perspective = 'ORTHO'
                    space.shading.type = 'MATERIAL'
                    break

def export_glb(avatar: str = 'kelly'):
    avatar = avatar.lower()
    out_dir = os.path.join(REPO_ROOT, "assets/avatars3d")
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{avatar}.glb")
    # Select only the active object for export (recommended)
    obj = bpy.context.active_object
    if not obj or obj.type != 'MESH':
        print("[warn] Select a MESH object to export.")
        return
    # Ensure only this object is selected
    for o in bpy.context.selected_objects:
        o.select_set(False)
    obj.select_set(True)
    bpy.context.view_layer.objects.active = obj
    # Export with shape keys
    bpy.ops.export_scene.gltf(
        filepath=out_path,
        export_format='GLB',
        use_selection=True,
        export_yup=True,
        export_apply=True,
        export_shape_keys=True,
        export_materials='EXPORT',
    )
    print(f"✅ Exported GLB with shape keys → {out_path}")

def main():
    # Parse optional args: --avatar=kelly|ken
    avatar = 'kelly'
    if "--" in sys.argv:
        for a in sys.argv[sys.argv.index("--")+1:]:
            if a.startswith("--avatar="):
                avatar = a.split("=",1)[1].strip() or avatar
    ensure_reference_head_if_none()
    spawn_front_photo(avatar)
    spawn_viseme_reference_grid()
    ensure_shape_keys_on_active()
    set_simple_view()
    print("✅ Scene ready: front photo, viseme grid, shape keys (A/E/I/MBP/FV/S). Use export_glb('kelly'|'ken').")

if __name__ == "__main__":
    # Allow optional flag to skip reference grid
    args = sys.argv[sys.argv.index("--")+1:] if "--" in sys.argv else []
    main()


