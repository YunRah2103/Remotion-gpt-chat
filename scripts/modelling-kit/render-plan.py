"""Native render matrix: retain legacy clips, distribute long recipes by absolute frame."""
import json
LEGACY=['KitA','KitB','KitC','KitD','KitE','KitAPortrait','KitBPortrait','KitCPortrait','KitDPortrait','KitEPortrait','KitBefore','KitF','KitFPortrait','KitG','KitGPortrait','KitH','KitHPortrait','KitI','KitIPortrait','KitWorldBefore']
STUDIO=['StudioRoadPortrait','StudioMechanicsPortrait','StudioF1Portrait','StudioRainPortrait']
def ranges(total,chunk=90):
    if not isinstance(total,int) or not isinstance(chunk,int) or total<1 or chunk<1:raise ValueError('Positive integer frame counts required')
    return [(start,min(total-1,start+chunk-1)) for start in range(0,total,chunk)]
def matrix():
    return {'include':[{'composition':name,'range':'','suffix':''} for name in LEGACY]+[{'composition':name,'range':f'{start}-{end}','suffix':f'-{start}-{end}'} for name in STUDIO for start,end in ranges(540)]}
if __name__=='__main__':print('matrix='+json.dumps(matrix(),separators=(',',':')))
