"""POLISH04 targeted PBR and close-up hardware refinement of the verified POLISH03 model.

Additive only: no canonical anchor edits, no movement edits, no alternate GPU.
The retail exterior is reference-guided; all internal components remain reconstructed.
Blender X length, Z height, -Y exposed triple-fan face; glTF exporter supplies Y-up.
"""
import bpy
import math

def _pbr(material, rgb, metallic, roughness, coat=0.0):
    if not material or not material.use_nodes:
        raise RuntimeError("Expected exported node-based PBR material: "+str(material))
    shader = material.node_tree.nodes.get("Principled BSDF")
    if shader is None:
        raise RuntimeError("Missing principled shader: "+material.name)
    material.diffuse_color = (*rgb, 1.0)
    shader.inputs["Base Color"].default_value = (*rgb, 1.0)
    shader.inputs["Metallic"].default_value = metallic
    shader.inputs["Roughness"].default_value = roughness
    coat_input = shader.inputs.get("Coat Weight") or shader.inputs.get("Clearcoat")
    if coat_input is not None:
        coat_input.default_value = coat

def augment(g):
    """Improve the *existing* model; returned scene stays fully assembled."""
    coll=g["coll"]
    mats=bpy.data.materials
    # Controlled dark polymer, isolated satin and glossy trim, subdued plated metals.
    # All these numbers are carried by Blender's GLB metallic-roughness exporter.
    recipes={
      "M_POLYMER_GRAPHITE":((.014,.017,.021),.04,.62,.02),
      "M_SHROUD_DARK":((.018,.021,.026),.07,.47,.06),
      "M_MONOLITHIC_XFX_FASCIA":((.013,.016,.019),.05,.51,.04),
      "M_ANGULAR_FASCIA_HIGHLIGHT":((.030,.035,.043),.10,.45,.03),
      "M_TRIPLE_FAN_BEZEL_BLACK":((.013,.015,.019),.16,.34,.12),
      "M_FAN_RING":((.014,.017,.022),.20,.44,.08),
      "M_FAN_BLADE":((.021,.025,.032),.10,.37,.14),
      "M_FAN_BLADE_WARM_BLACK":((.018,.022,.028),.07,.41,.08),
      "M_FAN_HUB":((.028,.032,.039),.10,.40,.11),
      "M_GLOSS_ACCENT":((.012,.014,.019),.27,.23,.18),
      "M_BRUSHED_ALUMINIUM":((.34,.37,.40),.91,.31,0),
      "M_HEATSINK_ANODISED_SILVER":((.24,.28,.32),.80,.38,0),
      "M_P3_FIN_FOLDED_ALUMINIUM":((.32,.36,.40),.86,.35,0),
      "M_P3_FIN_BRIGHT_EDGE":((.48,.52,.55),.91,.26,0),
      "M_NICKEL_COPPER":((.39,.41,.42),.94,.25,0),
      "M_COLDPLATE_NICKEL":((.44,.47,.48),.95,.23,0),
      "M_P3_PIPE_FERRULE":((.27,.30,.34),.94,.27,0),
      "M_PCB_DARK_GREEN":((.009,.029,.027),.02,.72,0),
      "M_CHIP_CERAMIC_DARK":((.016,.020,.027),.04,.57,0),
      "M_P3_PACKAGE_SUBSTRATE":((.020,.030,.037),.08,.52,0),
      "M_P3_CHOKE_FERRITE":((.038,.045,.052),.07,.64,0),
      "M_VRM_INDUCTOR_GRAPHITE":((.045,.052,.061),.08,.57,0),
      "M_P3_STATOR_CAST_GRAPHITE":((.023,.027,.033),.27,.43,0),
      "M_P3_STATOR_SATIN_BLACK":((.031,.035,.044),.22,.48,0),
      "M_P3_COPPER_WINDING":((.35,.19,.083),.87,.31,0),
      "M_CONTACT_GOLD":((.57,.37,.12),.91,.29,0),
      "M_CIRCUIT_TRACE_DULL_COPPER":((.18,.12,.055),.64,.53,0),
      "M_P3_COPPER_TRACE_SUBLAYER":((.088,.15,.11),.32,.65,0),
      "M_BACKPLATE_GRAPHITE":((.044,.049,.054),.56,.43,.02),
      "M_BACKPLATE_INSET":((.015,.018,.023),.18,.57,0),
      "M_P3_ANODISED_BEVEL":((.20,.22,.24),.83,.32,0),
      "M_P3_POLYMER_CAP_SLEEVE":((.043,.051,.064),.16,.48,.03),
    }
    changed=[]
    for name,args in recipes.items():
        if name not in mats:
            raise AssertionError("POLISH03 source material disappeared: "+name)
        _pbr(mats[name],*args);changed.append(name)

    make_mat=g["mat"]; box=g["box"]; torus=g["torus"]; cylinder=g["cylinder"]
    text_mesh=g["text_mesh"]
    fan_nodes=g["fan_nodes"]; shroud=g["shroud"]; fins=g["fins"]
    board=g["board"]; pcb=g["pcb"]; die=g["die"]; vram=g["vram"]
    pipes=g["pipes"]; back=g["back"]
    # Thin rims, dark machining and insulated metal instead of white-grey toy parts.
    gunmetal=make_mat("M_P4_HUB_MACHINED_GUNMETAL",(.14,.16,.18),.72,.34)
    gasket=make_mat("M_P4_GASKET_RUBBER",(.009,.011,.015),.02,.73)
    brushed=make_mat("M_P4_BEAD_BLASTED_ALUMINIUM",(.27,.30,.33),.82,.43)
    shadow_fin=make_mat("M_P4_FIN_INTERIOR_SHADOW",(.16,.20,.24),.69,.45)
    silicon_ink=make_mat("M_P4_PACKAGE_LASER_INK",(.17,.20,.21),.10,.70)
    silk=make_mat("M_P4_PCB_FINE_SILK",(.33,.39,.35),.02,.83)
    contact=make_mat("M_P4_NICKEL_CONTACT",(.43,.46,.48),.91,.28)
    for i,(cx,node) in enumerate(zip((-.94,0,.94),fan_nodes)):
        # Reprofile existing *watertight, real 3-D* rotor thickness instead of
        # adding 2D fan artwork. 28 vertices: front/back 14-vertex aerofoil skins.
        blades=[o for o in coll.objects if o.parent==node and o.name.startswith("BroadRotorBlade_")]
        assert len(blades)==9,(node.name,len(blades))
        for rotor in blades:
            assert rotor.type=="MESH" and len(rotor.data.vertices)==28
            for j,vertex in enumerate(rotor.data.vertices):
                vertex.co.y += (-.0018 if j<14 else .0022)
            rotor.data.update()
            for modifier in rotor.modifiers:
                if modifier.type=="BEVEL":
                    modifier.width=.0024;modifier.segments=3
        # Concentric mould line and metal insert around the existing true CAD hub.
        torus("P4_Hub_outer_tooling_ring_%d"%i,
              (cx,-.247,.025),.126,.0034,gunmetal,node)
        torus("P4_Hub_inset_rubber_gasket_%d"%i,
              (cx,-.248,.025),.107,.0023,gasket,node)
        cylinder("P4_Center_matte_insert_%d"%i,
                 (cx,-.249,.025),.066,.003,g["hubmat"],node,48)
        # No extra full opaque discs: cooling wells remain open to the fins.

    # Shroud details are restrained, away from the circular apertures.
    for side in (-1,1):
        for z in (-.520,.520):
            box("P4_Shroud_perimeter_recess_%d_%s"%(side,str(z)),
                (side*1.355,-.231,z),(.11,.003,.008),gasket,shroud,.002)
        box("P4_Endcap_edge_break_%d"%side,
            (side*1.428,-.167,0),(.007,.069,1.052),brushed,shroud,.004)

    # Remap some already physically separated fins to a darker alloy.
    # No additional fake solid comb mesh: the original 81 folded fins remain.
    fins_seen=0
    for ob in coll.objects:
        if ob.parent==fins and ob.name.startswith(("P3_L_fin_","P3_C_fin_","P3_R_fin_")):
            fins_seen+=1
            number=int(ob.name.split("_")[-1])
            if number%9==0:
                ob.data.materials[0]=shadow_fin
    assert fins_seen==81,("Expected all three fin banks",fins_seen)

    # Copper joints and dark collars follow the existing real 6 curved pipes.
    pipe_count=sum(o.name.startswith("P3_Heatpipe_") for o in coll.objects)
    assert pipe_count==6,pipe_count
    for i,zz in enumerate((-.155,0,.155)):
        for s,xx in ((-1,-.59),(1,.04)):
            torus("P4_Nickel_heatpipe_sleeve_%s_%d"%(s,i),
                  (xx,-.028,zz),.028,.0035,brushed,pipes)

    # Silicon markings are independent mesh geometry on packages, still owned by
    # the existing PCB/DIE/VRAM anchors. Textures/copyright imagery not used.
    text_mesh("NAVI 44","P4_GPU_package_etch",(-.395,.014,-.027),
              .034,silicon_ink,die,rot=(math.pi/2,0,0))
    for i,(xx,zz) in enumerate(((-.78,-.31),(-.78,.29),(.18,-.31),(.18,.29))):
        text_mesh("GDDR6","P4_VRAM_package_etch_%d"%i,(xx-.095,.030,zz-.025),
                  .029,silicon_ink,vram,rot=(math.pi/2,0,0))
        for dx in (-.083,.083):
            box("P4_VRAM_contact_tab_%d_%s"%(i,str(dx)),
                (xx+dx,.068,zz),(.016,.004,.11),contact,pcb,.002)
    # Discrete gold test lands and grouped regulator feed traces.
    for idx in range(8):
        zz=-.385+idx*.107
        box("P4_Power_trace_%02d"%idx,
            (.34,.072,zz),(.17,.002,.004),g["trace"],pcb,.001)
        cylinder("P4_Regulator_testpoint_%02d"%idx,
                 (.49,.071,zz),.012,.003,g["gold"],pcb,16)

    # Backplate remains the same vented one-piece silhouette: add metallic
    # chamfer highlights, not a decal spanning and hiding its physical opening.
    for side in (-1,1):
        box("P4_Backplate_end_chamfer_%d"%side,
            (side*1.413,.242,0),(.007,.007,1.046),brushed,back,.002)
    for xx,zz in ((-.96,-.44),(-.96,.44),(.20,-.44),(.20,.44)):
        torus("P4_Backplate_counterbore", (xx,.247,zz),
              .018,.0026,gunmetal,back)
        cylinder("P4_Backplate_fastener", (xx,.247,zz),
                 .008,.003,contact,back,16)

    g["P4_MATERIAL_NAMES"]=sorted(changed)
    g["P4_ADDED_MATERIALS"]=[
        "M_P4_HUB_MACHINED_GUNMETAL","M_P4_GASKET_RUBBER",
        "M_P4_BEAD_BLASTED_ALUMINIUM","M_P4_FIN_INTERIOR_SHADOW",
        "M_P4_PACKAGE_LASER_INK","M_P4_PCB_FINE_SILK","M_P4_NICKEL_CONTACT"]
    print("POLISH4_REFINEMENT_PASS",len(changed),
          "existing materials tuned; 27 physical rotor blades reprofiled;",
          fins_seen,"folded fins; 6 curved heatpipes; legible silicon markings")

def polish_studio(scene):
    """Native Cycles proof contrast, not an embedded film look or export texture."""
    background=scene.world.node_tree.nodes.get("Background")
    if background is not None:
        background.inputs["Strength"].default_value=.36
        background.inputs["Color"].default_value=(.030,.036,.045,1)
    lights=[o for o in scene.objects if o.type=="LIGHT"]
    for i,o in enumerate(lights):
        o.data.energy=(850,350,990)[i%3]
        o.data.color=((.90,.94,1.00),(1.00,.91,.82),(.85,.93,1.00))[i%3]
    try:
        scene.view_settings.view_transform="AgX"
        scene.view_settings.look="Medium High Contrast"
    except Exception:
        scene.view_settings.view_transform="Standard"
    scene.view_settings.exposure=-.12
    scene.view_settings.gamma=1.0
    print("POLISH4_STUDIO_PASS",len(lights),"photometric key/fill/rim")
