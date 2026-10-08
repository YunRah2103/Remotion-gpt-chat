"""Polish 03 hardware reconstruction augmentation.

Run from blender_generate.py, after the validated v2.4 base has been assembled.
Blender coordinates: X length, Z vertical, negative Y out toward the fans.
All engineering internals are illustrative; never claim OEM teardown/CAD accuracy.
This module preserves the GLB anchor hierarchy and the v2.4 deterministic motion.
"""
import bpy
import math
from mathutils import Vector

def augment(g):
    box=g["box"]; cylinder=g["cylinder"]; torus=g["torus"]
    bent_pipe=g["bent_pipe"]; mat=g["mat"]; linebar=g["linebar"]
    mesh_parent=g["mesh_parent"]; coll=g["coll"]
    fans=g["fan_nodes"]; shroud=g["shroud"]; fins=g["fins"]
    sink=g["sink"]; pipes=g["pipes"]; cold=g["cold"]
    pcb=g["pcb"]; die=g["die"]; vram=g["vram"]; vrm=g["vrm"]
    back=g["back"]; board=g["board"]; text_mesh=g["text_mesh"]
    steel=g["steel"]; finmat=g["finmat"]; gold=g["gold"]
    trace=g["trace"]; chipmat=g["chipmat"]; copper=g["copper"]
    hubmat=g["hubmat"]; rim=g["rim"]; edgeblack=g["edgeblack"]
    thermal=g["thermal"]; coldmat=g["coldmat"]

    # The previous fan "well" was a solid disc PARENTED TO THE ROTOR.
    # This hid the fin structure and made an exploding rotor carry its own wall.
    # Instead, true open bearing supports and stator spokes stay with the fascia.
    for obj in list(coll.objects):
        if obj.name.startswith("Recessed_black_cooler_well_"):
            bpy.data.objects.remove(obj, do_unlink=True)
    graphite=mat("M_P3_STATOR_CAST_GRAPHITE",(.024,.030,.035),.29,.46)
    satin=mat("M_P3_STATOR_SATIN_BLACK",(.040,.047,.055),.30,.39)
    for fi,cx in enumerate([-.94,0,.94]):
        torus("P3_Stator_open_well_ring_%d"%fi,
              (cx,-.164,.025),.411,.014,graphite,shroud)
        cylinder("P3_Bearing_mount_%d"%fi,(cx,-.162,.025),
                 .103,.042,graphite,shroud,48)
        for a in range(4):
            theta=(a+.27)*math.tau/4
            # Radial stabiliser struts are rigid to fascia, never to rotor.
            rr=.269; xx=cx+rr*math.cos(theta); zz=.025+rr*math.sin(theta)
            obj=box("P3_Stator_spoke_%d_%d"%(fi,a),
                    (xx,-.174,zz),(.325,.023,.019),satin,shroud,.006)
            obj.rotation_euler[1]=-theta
        torus("P3_Bearing_shoulder_%d"%fi,(cx,-.191,.025),
              .108,.012,steel,shroud)
        # Fine segmented annular trim exposes the physical depth of each well.
        for j in range(8):
            a=j*math.tau/8
            x=cx+.467*math.cos(a);z=.025+.467*math.sin(a)
            ob=box("P3_Anti_vibration_clip_%d_%d"%(fi,j),
                   (x,-.216,z),(.041,.010,.012),graphite,shroud,.003)
            ob.rotation_euler[1]=-a

    # Replace the monolithic straight-edged bars with three staggered dense
    # banks of physically separated, 3-D extruded, variable-profile fins.
    for obj in list(coll.objects):
        name = obj.name  # cache before deleting Blender's StructRNA pointer
        if (name.startswith("HeatsinkFin_") or name=="HeatsinkFrame"
                or name.startswith("HeatPipe6mm_")):
            bpy.data.objects.remove(obj,do_unlink=True)
    bright_fin=mat("M_P3_FIN_FOLDED_ALUMINIUM",(.43,.48,.52),.86,.25)
    edge_fin=mat("M_P3_FIN_BRIGHT_EDGE",(.66,.70,.73),.89,.20)
    for bank_i,cx in enumerate([-.94,0,.94]):
        for i in range(27):
            x=cx-.395 + i*(.790/26)
            profile=[
                (-.448,-.148),(-.395,-.161),
                (-.12,-.154),(.125,-.151),
                (.395,-.160),(.448,-.144),
                (.460,-.018),(-.460,-.018)]
            # Cross section has chamfered corners and a receded back edge;
            # it does not resemble stacked flat rectangular plates.
            n=len(profile)
            vv=[(x+side*.0056,yy,zz) for side in (-1,1)
                for (zz,yy) in profile]
            ff=[tuple(range(n-1,-1,-1)),tuple(range(n,n*2))]
            for q in range(n):
                k=(q+1)%n
                ff.append((q,k,k+n,q+n))
            mesh=bpy.data.meshes.new("P3_FoldedFinGeometry")
            mesh.from_pydata(vv,[],ff);mesh.update()
            ob=bpy.data.objects.new("P3_%s_fin_%02d"%(("L","C","R")[bank_i],i),mesh)
            coll.objects.link(ob);ob.parent=fins
            mesh.materials.append(bright_fin)
            if i%4==0:
                # Satin bright outer fold accent: physically visible at mobile scale.
                box("P3_FinLeadingFold_%d_%02d"%(bank_i,i),
                    (x,-.155,.00),(.011,.009,.78),edge_fin,fins,.003)
        for zz in (-.478,.480):
            box("P3_FinBank_rail_%d_%s"%(bank_i,str(zz)),
                (cx,-.067,zz),(.830,.160,.013),steel,fins,.004)
        # Heat exchanger end plates keep the fin stack visually credible.
        for side in (-1,1):
            box("P3_Endplate_%d_%d"%(bank_i,side),
                (cx+side*.412,-.075,0),(.024,.148,.91),finmat,fins,.004)

    # Real circular bent tubes radiate from the cold plate and return
    # into each cooling bank, rather than five nearly straight horizontal rods.
    for row in range(3):
        vz=(-.155,0,.155)[row]
        bend=(.05,.090,.12)[row]
        bent_pipe("P3_Heatpipe_left_%02d"%row,
          [(-.30,-.019,vz),(-.47,-.018,vz+bend*.2),
           (-.73,-.007,vz+bend),(-1.02,-.015,vz+bend*.7),
           (-1.30,-.030,vz+bend*.27)],copper,pipes,.027)
        bent_pipe("P3_Heatpipe_right_%02d"%row,
          [(-.28,-.020,vz),(-.02,-.018,vz-bend*.24),
           (.38,-.010,vz-bend),(.89,-.005,vz-bend*.58),
           (1.30,-.030,vz-bend*.10)],copper,pipes,.027)
    dark_nickel=mat("M_P3_PIPE_FERRULE",(.32,.34,.36),.93,.22)
    for xx in (-.55,-.07):
        for zz in (-.155,0,.155):
            torus("P3_Pipe_connection_ferrule",(xx,-.028,zz),
                  .029,.004,dark_nickel,pipes)
    # Lifted frame beneath a machined rectangular contact face.
    box("P3_Heatspreader_body",(-.23,-.018,0),
        (.61,.055,.58),coldmat,cold,.015)
    box("P3_Copper_contact_land",(-.23,.013,0),
        (.43,.013,.43),copper,cold,.008)
    for xx in (-.475,.015):
        for zz in (-.235,.235):
            cylinder("P3_Coldplate_anchor_bolt",(xx,-.044,zz),
                     .017,.017,steel,cold,20)

    # The GPU footprint remains on the PCB when the GPU_DIE anchor separates.
    solder=mat("M_P3_SOLDER_PAD_SILVER",(.43,.46,.47),.78,.34)
    blueblack=mat("M_P3_PACKAGE_SUBSTRATE",(.035,.049,.057),.12,.49)
    silk=mat("M_P3_PCB_SILKSCREEN",(.49,.57,.53),.03,.77)
    mask=mat("M_P3_COPPER_TRACE_SUBLAYER",(.19,.31,.24),.55,.44)
    box("P3_GPU_BGA_footprint",(-.30,.069,0),
        (.535,.006,.535),blueblack,pcb,.005)
    # Genuine contact dots on the package perimeter, not a texture rectangle.
    for side in (-1,1):
        for i in range(16):
            t=-.238+i*.0314
            cylinder("P3_GPU_bga_pad_X",(-.30+side*.252,.062,t),
                     .006,.002,solder,pcb,10)
            cylinder("P3_GPU_bga_pad_Z",(-.30+t,.062,side*.252),
                     .006,.002,solder,pcb,10)
    # Metallic retainer around the silicon, identifiable after removal.
    for xx in (-.515,-.085):
        box("P3_ASIC_package_retainer_vertical",(xx,.025,0),
            (.017,.010,.46),solder,die,.004)
    for zz in (-.215,.215):
        box("P3_ASIC_package_retainer_horizontal",(-.30,.025,zz),
            (.45,.010,.017),solder,die,.004)
    for (xx,zz) in [(-.78,-.31),(-.78,.29),(.18,-.31),(.18,.29)]:
        box("P3_GDDR6_memory_solder_landing",(xx,.067,zz),
            (.255,.004,.207),mask,pcb,.002)
        for ix in range(6):
            for sz in (-1,1):
                box("P3_Memory_BGA_testpad",(xx-.092+ix*.038,.063,zz+sz*.104),
                    (.016,.003,.006),gold,pcb)
    # SMD capacitors have real nickel terminations at either end.
    bodymat=mat("M_P3_CERAMIC_CAP_BODY",(.41,.40,.35),.18,.58)
    for i in range(46):
        xx=-1.25+(i%12)*.165
        zz=-.44+(i//12)*.225
        if -.66<xx<.05 and abs(zz)<.28:continue
        if xx>.59:continue
        box("P3_MLCC_dielectric_%02d"%i,(xx,.064,zz),
            (.044,.020,.024),bodymat,vrm,.003)
        for s in (-1,1):
            box("P3_MLCC_terminal_%02d_%d"%(i,s),
                (xx+s*.023,.064,zz),(.007,.021,.026),solder,vrm,.001)
    # High-contrast large VRM stages for mobile viewing, with copper windings
    # physically wound around independent square graphite inductors.
    choke=mat("M_P3_CHOKE_FERRITE",(.063,.068,.079),.20,.48)
    coil=mat("M_P3_COPPER_WINDING",(.37,.22,.115),.77,.31)
    for k,zz in enumerate((-.39,-.18,.04,.25,.43)):
        xx=.477 if k%2 else .40
        box("P3_Regulator_inductor_%d"%k,(xx,.046,zz),
            (.128,.048,.110),choke,vrm,.009)
        for j in range(3):
            box("P3_Inductor_copper_winding_%d_%d"%(k,j),
                (xx-.042+j*.041,.018,zz),(.009,.005,.076),coil,vrm,.002)
        box("P3_DrMOS_switch_package_%d"%k,(xx-.156,.054,zz),
            (.098,.029,.065),chipmat,vrm,.004)
        for pin in range(4):
            box("P3_DrMOS_silver_terminal_%d_%d"%(k,pin),
                (xx-.206,.052,zz-.024+pin*.016),
                (.010,.010,.007),solder,vrm)
    # Distinct tall aluminium-polymer capacitors, metallic caps and labels.
    cap_shell=mat("M_P3_POLYMER_CAP_SLEEVE",(.065,.073,.083),.36,.45)
    for i,(xx,zz) in enumerate([
        (-1.18,.37),(-1.18,.23),(-1.18,-.19),(-1.18,-.34),
        (.575,-.42),(.575,-.17),(.575,.09),(.575,.35)]):
        cylinder("P3_VRM_bulk_cap_body_%02d"%i,(xx,.039,zz),
                 .033,.052,cap_shell,vrm,24)
        cylinder("P3_VRM_bulk_cap_metal_top_%02d"%i,(xx,.011,zz),
                 .029,.004,solder,vrm,24)
        for a in (-.018,.018):
            box("P3_Cap_top_engraving_%02d"%i,(xx+a,.008,zz),
                (.006,.002,.039),graphite,vrm)
    # Controlled circuit traces with bends and surface vias.
    for idx in range(28):
        xx=-1.34+idx*.066
        if -.58<xx<-.03:continue
        st=.40 if idx%2 else -.39
        zz=st+(.025 if idx%2 else -.025)
        ob=box("P3_SignalRoute_%02d"%idx,
               (xx+.030,.071,zz),(.078,.002,.004),mask,pcb,.001)
        ob.rotation_euler[1]=(-.55 if idx%2 else .55)
    for i in range(22):
        xx=-1.28+(i%11)*.166
        zz=(-.47,.47)[i//11]
        cylinder("P3_Plated_via_%02d"%i,(xx,.073,zz),
                 .010,.002,gold,pcb,12)
    # Subtle printed labelling, mesh text, bound to PCB and die.
    text_mesh("GDDR6","P3_VRAM_board_legend",(-.94,.062,.485),
              .062,silk,pcb,rot=(math.pi/2,0,0))

    # Additional machined metal detail, keeping the XFX rear exhaust genuinely
    # open. The three-dimensional rim encircles, rather than blocks, the window.
    polished=mat("M_P3_ANODISED_BEVEL",(.18,.205,.225),.74,.31)
    for zz in (-.485,.485):
        box("P3_Exhaust_reinforcing_lip", (1.012,.245,zz),
            (.775,.011,.010),polished,back,.003)
    for xx in (.615,1.403):
        box("P3_Exhaust_side_frame",(xx,.245,0),
            (.011,.012,.964),polished,back,.003)
    # Rear VRAM pads remain part of backplate; a very thin gasket step
    # makes the detached metal layer look manufactured, not a flat tile.
    for xx in (-1.20,-.55,.18):
        box("P3_Backplate_inner_rib",(xx,.207,0),
            (.013,.013,.83),graphite,back,.004)

    print("POLISH3_GEOMETRY_PASS",
          "open three rotor wells, 81 folded fins, 6 true swept heatpipes, "
          "PCB ball-grid lands, capacitors, regulators, through-holes and rear tooling")
