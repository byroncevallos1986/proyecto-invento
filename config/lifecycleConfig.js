module.exports = {
  /*Si un usuario creado no se loguea por más de 30 días seguidos, se inactiva automáticamente*/
  DIAS_INACTIVO: 30,

  /*Luego de inactivar de forma manual (front end) un usuario, deben pasar 40 días seguidos 
  para ser anonimizado de forma automática*/
  DIAS_ANOM: 40,

  /*Luego de anomización de un usuario, deben pasar 1825 días seguidos 
  para ser eliminado (Soft-delete) de forma automática*/
  DIAS_SOFT_DELETE: 1825,

  /*Luego de ser eliminado (Soft-delete) un usuario, debe pasar 1 día 
  para ser eliminado definitivamente (Hard-delete) de forma automática*/
  DIAS_HARD_DELETE: 1
};