-- MySQL dump 10.16  Distrib 10.1.26-MariaDB, for Win32 (AMD64)
--
-- Host: localhost    Database: sisventareact
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `ajustes`
--

DROP TABLE IF EXISTS `ajustes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ajustes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `motivo` varchar(255) NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `ajustes_producto_id_foreign` (`producto_id`),
  KEY `ajustes_empresa_id_foreign` (`empresa_id`),
  KEY `ajustes_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `ajustes_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ajustes_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ajustes_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ajustes`
--

LOCK TABLES `ajustes` WRITE;
/*!40000 ALTER TABLE `ajustes` DISABLE KEYS */;
INSERT INTO `ajustes` VALUES (1,4,1,'salida',1.00,'Envase roto','2026-01-08 17:05:00',1,'2026-01-11 20:05:45','2026-01-11 20:05:45'),(2,15,1,'entrada',1.00,'Sobrante en auditoria','2026-01-08 17:09:00',1,'2026-01-11 20:09:58','2026-01-11 20:09:58');
/*!40000 ALTER TABLE `ajustes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `arqueos`
--

DROP TABLE IF EXISTS `arqueos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `arqueos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `fecha_apertura` datetime NOT NULL,
  `fecha_cierre` datetime DEFAULT NULL,
  `estado` varchar(20) DEFAULT 'Abierto',
  `monto_inicial` decimal(10,2) DEFAULT NULL,
  `monto_final` decimal(10,2) DEFAULT NULL,
  `monto_esperado` decimal(18,2) DEFAULT 0.00,
  `diferencia` decimal(18,2) DEFAULT 0.00,
  `ventas_efectivo` decimal(10,2) DEFAULT 0.00,
  `ventas_tarjeta` decimal(10,2) DEFAULT 0.00,
  `ventas_mercadopago` decimal(10,2) DEFAULT 0.00,
  `ventas_transferencia` decimal(18,2) DEFAULT 0.00,
  `descripcion` varchar(255) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `arqueos_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `arqueos_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `arqueos`
--

LOCK TABLES `arqueos` WRITE;
/*!40000 ALTER TABLE `arqueos` DISABLE KEYS */;
INSERT INTO `arqueos` VALUES (1,1,1,1,'2026-01-01 13:00:00','2026-01-01 13:59:00','Cerrado',15000.00,24700.00,24700.00,0.00,15000.00,0.00,9700.00,0.00,'Apertura Tarde','2026-01-11 19:51:52','2026-01-11 17:08:46'),(2,1,1,1,'2026-01-02 09:00:00','2026-01-02 15:11:00','Cerrado',10000.00,30000.00,30000.00,0.00,30000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-11 20:11:34','2026-01-11 18:12:26'),(3,1,1,2,'2026-01-03 09:00:00','2026-01-03 15:20:00','Cerrado',10000.00,17000.00,17000.00,0.00,7000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-11 21:15:57','2026-01-11 18:31:02'),(4,1,1,1,'2026-01-04 09:00:00','2026-01-11 15:48:00','Cerrado',10000.00,16000.00,16000.00,0.00,16000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-11 21:32:58','2026-01-11 18:48:48'),(5,1,1,2,'2026-01-05 09:00:00','2026-01-05 16:06:00','Cerrado',10000.00,21500.00,21500.00,0.00,21500.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-11 21:54:25','2026-01-11 19:07:02'),(6,1,1,1,'2026-01-06 09:00:00','2026-01-06 16:33:00','Cerrado',10000.00,30200.00,30200.00,0.00,15000.00,0.00,15200.00,0.00,'Apertura Matutina','2026-01-11 22:10:10','2026-01-11 19:34:04'),(7,1,1,1,'2026-01-07 09:00:00','2026-01-07 16:37:00','Cerrado',10000.00,27960.00,27960.00,0.00,10000.00,0.00,17960.00,0.00,'Apertura Matutina','2026-01-11 22:35:16','2026-01-11 19:38:04'),(8,1,1,1,'2026-01-08 09:00:00','2026-01-08 17:03:00','Cerrado',10000.00,38800.00,38800.00,0.00,20000.00,0.00,18800.00,0.00,'Apertura Matutina','2026-01-11 22:40:10','2026-01-11 20:04:32'),(9,1,1,1,'2026-01-09 09:00:00','2026-01-09 17:17:00','Cerrado',10000.00,32910.00,32910.00,0.00,10000.00,22910.00,0.00,0.00,'Apertura Matutina','2026-01-11 23:11:02','2026-01-11 20:18:04'),(10,1,1,1,'2026-01-10 09:00:00','2026-01-10 17:25:00','Cerrado',10000.00,30265.50,30265.50,0.00,10000.00,11300.00,8965.50,0.00,'Apertura Matutina','2026-01-11 23:18:43','2026-01-11 20:25:45'),(11,1,1,1,'2026-01-11 09:00:00','2026-01-11 11:22:00','Cerrado',10000.00,20000.00,20000.00,0.00,20000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-11 23:26:15','2026-01-12 14:22:35'),(12,1,1,1,'2026-01-12 09:00:00','2026-01-12 13:59:00','Cerrado',10000.00,32100.00,32100.00,0.00,19100.00,0.00,13000.00,0.00,'Apertura Matutina','2026-01-12 17:40:13','2026-01-12 17:00:00'),(13,1,2,2,'2026-01-12 13:00:00','2026-01-12 15:50:00','Cerrado',10000.00,10000.00,10000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-12 21:25:52','2026-01-12 18:51:07'),(14,1,2,2,'2026-01-12 15:51:00','2026-01-12 16:15:00','Cerrado',10000.00,19200.00,19200.00,0.00,9200.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-12 18:51:34','2026-01-12 19:17:08'),(15,1,1,1,'2026-01-12 17:00:00','2026-01-12 22:00:00','Cerrado',10000.00,37800.00,37800.00,0.00,35970.00,0.00,1830.00,0.00,'Apertura Nocturna','2026-01-12 20:01:33','2026-01-13 03:13:59'),(16,1,1,1,'2026-01-13 09:00:00','2026-01-13 19:02:00','Cerrado',10000.00,20000.00,20000.00,0.00,15000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-13 15:19:04','2026-01-13 22:11:13'),(17,1,1,1,'2026-01-13 18:00:00','2026-01-13 22:00:00','Cerrado',10000.00,15000.00,15000.00,0.00,15000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-13 22:12:27','2026-01-14 14:14:46'),(18,1,1,1,'2026-01-14 09:00:00','2026-01-14 11:23:00','Cerrado',10000.00,15000.00,15000.00,0.00,15000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-14 14:21:15','2026-01-14 14:30:31'),(19,1,1,1,'2026-01-14 10:00:00','2026-01-14 11:48:00','Cerrado',10000.00,15000.00,15000.00,0.00,15000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-14 14:35:32','2026-01-14 14:51:42'),(20,1,1,1,'2026-01-14 11:00:00','2026-01-14 11:54:00','Cerrado',10000.00,15000.00,15000.00,0.00,5000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-14 14:52:29','2026-01-14 18:34:30'),(21,1,1,1,'2026-01-14 11:55:00','2026-01-14 13:04:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 14:55:50','2026-01-14 18:34:20'),(22,1,1,1,'2026-01-14 13:07:00','2026-01-14 13:08:00','Cerrado',10000.00,10000.00,10000.00,0.00,0.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 16:07:42','2026-01-14 18:34:11'),(23,1,1,1,'2026-01-14 13:18:00','2026-01-14 13:19:00','Cerrado',10000.00,19000.00,19000.00,0.00,9000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 16:18:22','2026-01-14 18:33:47'),(24,1,1,1,'2026-01-14 13:24:00','2026-01-14 13:25:00','Cerrado',10000.00,15000.00,15000.00,0.00,5000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 16:24:18','2026-01-14 18:33:39'),(25,1,1,1,'2026-01-14 13:45:00','2026-01-14 13:45:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 16:45:09','2026-01-14 18:33:31'),(26,1,1,1,'2026-01-14 13:55:00','2026-01-14 14:01:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 16:55:33','2026-01-14 18:33:17'),(27,1,1,1,'2026-01-14 14:05:00','2026-01-14 14:06:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 17:05:31','2026-01-14 18:33:12'),(28,1,1,1,'2026-01-14 14:10:00','2026-01-14 14:12:00','Cerrado',10000.00,16000.00,16000.00,0.00,6000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 17:10:51','2026-01-14 18:33:03'),(29,1,1,1,'2026-01-14 14:17:00','2026-01-14 14:17:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 17:17:13','2026-01-14 18:32:56'),(30,1,1,1,'2026-01-14 14:29:00','2026-01-14 15:07:00','Cerrado',10000.00,19000.00,19000.00,0.00,9000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 17:29:30','2026-01-14 18:32:48'),(31,1,1,1,'2026-01-14 15:12:00','2026-01-14 15:13:00','Cerrado',10000.00,17000.00,17000.00,0.00,7000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 18:12:30','2026-01-14 18:18:26'),(32,1,1,1,'2026-01-14 15:22:00','2026-01-14 15:23:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-14 18:22:21','2026-01-14 18:23:22'),(33,1,1,1,'2026-01-14 15:29:00','2026-01-14 15:29:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 18:29:12','2026-01-14 18:29:50'),(34,1,1,1,'2026-01-14 16:13:00','2026-01-14 19:23:00','Cerrado',10000.00,31500.00,31500.00,0.00,21500.00,0.00,0.00,0.00,'Apertura Tarde','2026-01-14 19:13:35','2026-01-14 22:23:34'),(35,1,1,1,'2026-01-15 10:41:00','2026-01-15 21:31:00','Cerrado',10000.00,24000.00,24000.00,0.00,14000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-15 13:41:51','2026-01-16 00:32:10'),(36,1,1,1,'2026-01-16 09:00:00','2026-01-16 22:58:00','Cerrado',10000.00,52000.00,52000.00,0.00,21900.00,0.00,20100.00,0.00,'Apertura Matutina','2026-01-16 13:32:13','2026-01-17 02:08:35'),(37,1,1,1,'2026-01-16 23:03:00','2026-01-16 23:10:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,10000.00,0.00,'Apertura Nocturna','2026-01-17 02:03:59','2026-01-17 02:42:33'),(38,1,1,1,'2026-01-16 23:13:00','2026-01-16 23:17:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,10000.00,0.00,'Apertura Nocturna','2026-01-17 02:13:29','2026-01-17 02:18:05'),(39,1,1,1,'2026-01-17 03:34:00','2026-01-17 10:59:00','Cerrado',10000.00,20000.00,20000.00,0.00,10000.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-17 06:34:27','2026-01-17 14:00:09'),(40,1,2,2,'2026-01-17 09:00:00','2026-01-17 14:38:00','Cerrado',10000.00,22800.00,22800.00,0.00,12800.00,0.00,12600.00,0.00,'Apertura Matutina','2026-01-17 14:10:02','2026-01-17 17:46:08'),(41,1,2,1,'2026-01-17 14:46:00','2026-01-17 14:50:00','Cerrado',10000.00,20800.00,20800.00,0.00,10800.00,0.00,5700.00,0.00,'Apertura Tarde','2026-01-17 17:46:57','2026-01-17 17:50:19'),(42,1,2,2,'2026-01-17 14:51:00','2026-01-17 23:58:00','Cerrado',10000.00,59400.00,59400.00,0.00,49400.00,9100.00,20900.00,14900.00,'Apertura Tarde','2026-01-17 17:52:03','2026-01-18 02:59:11'),(43,1,2,2,'2026-01-18 00:11:00','2026-01-18 00:57:00','Cerrado',10000.00,49900.00,49900.00,0.00,0.00,0.00,0.00,0.00,'Apertura Matutina','2026-01-18 03:11:40','2026-01-18 03:57:46'),(44,1,2,2,'2026-01-18 09:00:00','2026-01-18 14:50:00','Cerrado',10000.00,73500.00,73500.00,0.00,63500.00,0.00,24500.00,0.00,'Apertura Matutina','2026-01-18 12:38:29','2026-01-18 17:51:06'),(45,1,2,6,'2026-01-18 15:11:00','2026-01-18 18:04:00','Cerrado',10000.00,30800.00,30800.00,0.00,20800.00,4900.00,6800.00,0.00,'Apertura Tarde','2026-01-18 18:11:54','2026-01-18 21:04:23'),(46,1,1,6,'2026-01-18 18:08:00','2026-01-18 18:48:00','Cerrado',10000.00,17600.00,17600.00,0.00,7600.00,6100.00,8000.00,4300.00,'Apertura Tarde','2026-01-18 21:08:56','2026-01-18 21:49:09'),(47,1,2,2,'2026-01-18 18:55:00','2026-01-18 21:57:00','Cerrado',10000.00,30400.00,30400.00,0.00,20400.00,23500.00,9100.00,0.00,'Apertura Tarde','2026-01-18 21:55:28','2026-01-19 00:57:58'),(48,1,2,6,'2026-01-19 10:00:00','2026-01-19 19:52:00','Cerrado',10000.00,171400.00,171400.00,0.00,162700.00,15900.00,52800.00,12200.00,'Apertura Matutina','2026-01-19 13:59:30','2026-01-19 22:53:12');
/*!40000 ALTER TABLE `arqueos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `auditoria_seguridad`
--

DROP TABLE IF EXISTS `auditoria_seguridad`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `auditoria_seguridad` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `usuario_id` int(11) NOT NULL,
  `caja_id` int(11) NOT NULL,
  `tipo_evento` enum('ITEM_BORRADO','VENTA_CANCELADA','DESCUENTO_EXCESIVO','TICKET_CERO') DEFAULT NULL,
  `detalle` text DEFAULT NULL,
  `monto_afectado` decimal(12,2) DEFAULT 0.00,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `auditoria_seguridad`
--

LOCK TABLES `auditoria_seguridad` WRITE;
/*!40000 ALTER TABLE `auditoria_seguridad` DISABLE KEYS */;
INSERT INTO `auditoria_seguridad` VALUES (1,1,1,'ITEM_BORRADO','Borro 1 unid. de Chipá tipo caseros Lucchetti 400g',3000.00,'2026-01-14 15:09:09','2026-01-17 00:23:02'),(2,1,1,'ITEM_BORRADO','Borro 2 unid. de Lactal - Pan de Mesa - 460g. Fargo',7000.00,'2026-01-14 17:11:11','2026-01-17 00:23:02'),(3,1,1,'ITEM_BORRADO','Borro 2 unid. de Coca Cola 2L Env. Retornable',7000.00,'2026-01-14 19:57:53','2026-01-17 00:23:02'),(4,1,1,'ITEM_BORRADO','Borro 1 unid. de Coca Cola 2L Env. Retornable',3500.00,'2026-01-15 14:08:42','2026-01-17 00:23:02'),(5,1,1,'ITEM_BORRADO','Borro 1 unid. de Vino Luigi Bosca - Tinto - Malbec - 750ml',14400.00,'2026-01-17 00:25:17','2026-01-17 00:25:17'),(6,1,1,'ITEM_BORRADO','Borro 1 unid. de Combo Jamon y Queso 500g',5800.00,'2026-01-17 00:26:03','2026-01-17 00:26:03'),(7,1,1,'ITEM_BORRADO','Borro 1 unid. de Combo Invierno',6000.00,'2026-01-17 00:46:31','2026-01-17 00:46:31'),(8,2,2,'ITEM_BORRADO','Borro 1 unid. de Budin Limon Fantasía Nevares 180g',2000.00,'2026-01-18 13:56:05','2026-01-18 13:56:05'),(9,6,2,'ITEM_BORRADO','Borro 1 unid. de Combo Leche - Chocolate',5000.00,'2026-01-19 17:18:31','2026-01-19 17:18:31'),(10,6,2,'ITEM_BORRADO','Borro 1 unid. de Coca Cola 2L Env. Retornable',3500.00,'2026-01-19 17:18:31','2026-01-19 17:18:31');
/*!40000 ALTER TABLE `auditoria_seguridad` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias`
--

DROP TABLE IF EXISTS `categorias`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `margen_objetivo` decimal(5,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `categorias_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias`
--

LOCK TABLES `categorias` WRITE;
/*!40000 ALTER TABLE `categorias` DISABLE KEYS */;
INSERT INTO `categorias` VALUES (1,'Bebidas sin alcohol','Bebidas naturales, juegos, gaceosas, agua.',1,'2025-03-03 18:23:29','2025-03-03 18:23:29',100.00),(2,'Bebidas alcohólicas','Vinos, cervesas, wiskys, espumantes',1,'2025-03-03 18:24:49','2025-03-03 18:24:49',100.00),(3,'Pastas','Todo relacionado a las pastas (fideos secos, pastas caseras, etc)',1,'2025-03-03 19:23:46','2025-03-03 19:23:46',100.00),(4,'Galletitas','Todo tipo de galletitas',1,'2025-03-03 20:17:49','2025-03-03 20:17:49',200.00),(5,'Productos enlatados','todos los enlatados',1,'2025-03-04 14:18:44','2025-03-04 14:18:44',100.00),(6,'Almacen','Productos en Polvo, Productos Instantaneos',1,'2025-03-26 13:39:45','2025-03-31 14:41:07',100.00),(7,'Fiambrería','Productos de Fiambrería',1,'2025-03-30 15:46:34','2025-03-30 15:46:34',100.00),(8,'Panaderia','Productos Panificados',1,'2025-03-30 16:11:28','2025-03-30 16:11:28',100.00),(9,'Productos lácteos','Queso rallado',1,'2025-04-08 14:48:20','2025-04-08 14:48:20',100.00),(10,'Perfumeria','Perfumes, desodorantes, porductos de limpieza personal',0,NULL,NULL,100.00),(14,'Cuidado Personal','repelentes tópicos (en crema, loción, spray para la piel)',0,NULL,NULL,100.00),(15,'Limpieza','Lavandina, Bolsas Residuos, Bolsas Consorcio',0,NULL,NULL,100.00),(16,'Golosinas','Caramelos, Gomitas, Alfajores',0,NULL,NULL,100.00);
/*!40000 ALTER TABLE `categorias` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categorias_gastos`
--

DROP TABLE IF EXISTS `categorias_gastos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categorias_gastos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `tipo` enum('fijo','variable') DEFAULT 'variable',
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `categorias_gastos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categorias_gastos`
--

LOCK TABLES `categorias_gastos` WRITE;
/*!40000 ALTER TABLE `categorias_gastos` DISABLE KEYS */;
INSERT INTO `categorias_gastos` VALUES (1,'Alquiler','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:17:53'),(2,'Luz','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:23:23'),(3,'Internet','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:18:04'),(4,'Sueldos','fijo',1,'2026-01-05 19:06:09','2026-01-15 17:23:40'),(5,'Limpieza','variable',1,'2026-01-05 19:06:09','2026-01-15 17:16:27'),(6,'Otros','variable',1,'2026-01-05 19:06:09','2026-01-15 17:16:52'),(7,'Agua','fijo',1,'2026-01-15 17:19:40','2026-01-15 17:19:40'),(8,'Gas','fijo',1,'2026-01-15 17:23:05','2026-01-15 17:23:05');
/*!40000 ALTER TABLE `categorias_gastos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clientes`
--

DROP TABLE IF EXISTS `clientes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clientes` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre_cliente` varchar(255) NOT NULL,
  `cuil_codigo` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `fecha_nacimiento` date DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `puntos` int(11) DEFAULT 0,
  `saldo_billetera` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clientes`
--

LOCK TABLES `clientes` WRITE;
/*!40000 ALTER TABLE `clientes` DISABLE KEYS */;
INSERT INTO `clientes` VALUES (1,'Consumidor Final','00000000000','99999999','consumidorfinal@gmail.com',NULL,1,'2025-03-03 23:31:59','2025-03-03 23:31:59',0,0.00),(2,'Morrone Pablo Martín','22362590','1138669097','morronepablo@gmail.com','1971-08-14',1,'2025-03-04 17:47:48','2026-01-19 20:47:24',741,13000.00),(3,'Natalia Oduber','94654750','1138669097','nataliaoduber@gmail.com','2024-01-15',1,'2025-04-05 22:50:51','2026-01-15 20:05:49',236,0.00),(4,'Gustavo Vessani','20221349877','1138669097','gustavo@gmail.com',NULL,1,'2026-01-02 05:08:34','2026-01-19 21:24:42',366,0.00),(5,'Diego Martin Trinidad','25369785','1138669097','diegotrinidad@gmail.com','2025-01-15',1,'2026-01-06 11:58:54','2026-01-19 21:24:16',638,2000.00),(6,'Alba Alisa Rodriguez','96441182','1138669097','salbaearch@gmail.com',NULL,1,'2026-01-15 20:02:56','2026-01-19 21:19:49',1228,3000.00);
/*!40000 ALTER TABLE `clientes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combo_producto`
--

DROP TABLE IF EXISTS `combo_producto`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `combo_producto` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `combo_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `cantidad` int(11) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `combo_producto_combo_id_foreign` (`combo_id`),
  KEY `combo_producto_producto_id_foreign` (`producto_id`),
  CONSTRAINT `combo_producto_combo_id_foreign` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE,
  CONSTRAINT `combo_producto_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combo_producto`
--

LOCK TABLES `combo_producto` WRITE;
/*!40000 ALTER TABLE `combo_producto` DISABLE KEYS */;
INSERT INTO `combo_producto` VALUES (1,1,1,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(2,1,6,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(3,1,4,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(4,2,3,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(5,2,2,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(6,2,10,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(7,2,9,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(10,3,12,250,'2025-03-31 14:32:59','2025-03-31 14:32:59'),(11,3,13,250,'2025-03-31 14:32:59','2025-03-31 14:32:59'),(15,4,1,1,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(16,4,2,2,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(17,4,9,1,'2026-01-06 13:41:05','2026-01-06 13:41:05'),(18,5,34,1,'2026-01-17 20:59:55','2026-01-17 20:59:55'),(19,5,9,1,'2026-01-17 20:59:55','2026-01-17 20:59:55');
/*!40000 ALTER TABLE `combo_producto` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `combos`
--

DROP TABLE IF EXISTS `combos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `combos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `codigo` varchar(255) NOT NULL,
  `precio_venta` decimal(8,2) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `combos_nombre_unique` (`nombre`),
  UNIQUE KEY `combos_codigo_unique` (`codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `combos`
--

LOCK TABLES `combos` WRITE;
/*!40000 ALTER TABLE `combos` DISABLE KEYS */;
INSERT INTO `combos` VALUES (1,'Combo Navidad','1001',10000.00,1,'2025-03-29 19:04:39','2025-03-29 19:04:39'),(2,'Combo Invierno','1002',6000.00,1,'2025-03-29 21:34:49','2025-03-29 21:34:49'),(3,'Combo Jamon y Queso 500g','1003',5800.00,1,'2025-03-30 16:46:55','2025-03-30 16:46:55'),(4,'Combo Reyes','1004',5000.00,1,'2026-01-03 03:07:46','2026-01-06 13:41:05'),(5,'Combo Leche - Chocolate','1005',5000.00,1,'2026-01-17 20:59:55','2026-01-17 20:59:55');
/*!40000 ALTER TABLE `combos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras`
--

DROP TABLE IF EXISTS `compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `comprobante` varchar(255) NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `deuda` decimal(10,2) NOT NULL DEFAULT 0.00,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `compras_proveedor_id_foreign` (`proveedor_id`),
  KEY `compras_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=32 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras`
--

LOCK TABLES `compras` WRITE;
/*!40000 ALTER TABLE `compras` DISABLE KEYS */;
INSERT INTO `compras` VALUES (1,'2026-01-01','FACTURA - 0001-0000001',15500.00,10000.00,1,1,1,4,'2026-01-11 16:52:25','2026-01-11 16:52:25'),(2,'2026-01-01','FACTURA - 0001-0000001',7500.00,7500.00,1,1,1,12,'2026-01-11 16:53:12','2026-01-11 16:53:12'),(3,'2026-01-02','FACTURA - 0001-0000001',20000.00,20000.00,1,1,1,18,'2026-01-11 17:41:26','2026-01-11 17:41:26'),(7,'2026-01-14','FACTURA - 0001-0000001',2100.00,0.00,1,1,1,19,'2026-01-14 22:03:31','2026-01-14 22:03:31'),(8,'2026-01-15','FACTURA - 0001-0000001',2900.00,2900.00,1,1,1,11,'2026-01-15 15:12:50','2026-01-15 15:12:50'),(9,'2026-01-15','FACTURA - 0001-0000002',2900.00,2900.00,1,1,1,11,'2026-01-15 15:44:20','2026-01-15 15:44:20'),(10,'2026-01-15','FACTURA - 0001-0000003',2900.00,2900.00,1,1,1,11,'2026-01-15 15:51:44','2026-01-15 15:51:44'),(11,'2026-01-15','FACTURA - 0001-0000002',23000.00,0.00,1,1,1,19,'2026-01-15 22:59:24','2026-01-15 22:59:24'),(12,'2026-01-16','FACTURA - 0001-0000003',23000.00,23000.00,1,1,1,19,'2026-01-16 13:34:37','2026-01-16 13:34:37'),(13,'2026-01-16','FACTURA - 0001-0000002',12000.00,12000.00,1,1,1,18,'2026-01-16 13:36:47','2026-01-16 13:36:47'),(14,'2026-01-16','FACTURA - 0001-0000001',15000.00,0.00,1,1,1,9,'2026-01-16 22:42:47','2026-01-16 22:42:47'),(15,'2026-01-16','FACTURA - 0001-0000002',15000.00,15000.00,1,1,1,9,'2026-01-16 22:45:05','2026-01-16 22:45:05'),(16,'2026-01-16','FACTURA - 0001-0000002',35000.00,35000.00,1,1,1,4,'2026-01-16 23:07:51','2026-01-16 23:07:51'),(17,'2026-01-16','FACTURA - 0001-0000001',10000.00,10000.00,1,1,1,20,'2026-01-17 01:06:59','2026-01-17 01:06:59'),(18,'2026-01-16','FACTURA - 0001-0000003',17500.00,17500.00,1,1,1,4,'2026-01-17 01:11:07','2026-01-17 01:11:07'),(19,'2026-01-17','FACTURA - 0001-0000001',105000.00,0.00,1,1,2,15,'2026-01-17 17:14:41','2026-01-17 17:14:41'),(20,'2026-01-17','FACTURA - 0001-0000001',162000.00,0.00,1,1,2,8,'2026-01-17 19:43:19','2026-01-17 19:43:19'),(21,'2026-01-17','FACTURA - 0001-0000001',110000.00,0.00,1,1,2,23,'2026-01-18 00:29:07','2026-01-18 00:29:07'),(22,'2026-01-17','FACTURA - 0001-0000001',20000.00,0.00,1,1,2,22,'2026-01-18 00:31:27','2026-01-18 00:31:27'),(23,'2026-01-17','FACTURA - 0001-0000001',32000.00,0.00,1,1,2,24,'2026-01-18 02:53:41','2026-01-18 02:53:41'),(24,'2026-01-17','FACTURA - 0001-0000002',15000.00,0.00,1,1,2,22,'2026-01-18 02:54:41','2026-01-18 02:54:41'),(25,'2026-01-18','FACTURA - 0001-0000001',132500.00,0.00,1,1,2,21,'2026-01-18 03:15:46','2026-01-18 03:15:46'),(26,'2026-01-18','FACTURA - 0001-0000003',93000.00,0.00,1,1,2,22,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(27,'2026-01-19','FACTURA - 0001-0000002',15000.00,15000.00,1,1,6,24,'2026-01-19 15:41:02','2026-01-19 15:41:02'),(28,'2026-01-19','FACTURA - 0001-0000004',14000.00,14000.00,1,1,6,22,'2026-01-19 16:29:47','2026-01-19 16:29:47'),(29,'2026-01-19','FACTURA - 0001-0000004',87500.00,0.00,1,1,6,4,'2026-01-19 22:24:31','2026-01-19 22:24:31'),(30,'2026-01-19','FACTURA - 0001-0000005',22000.00,0.00,1,1,6,22,'2026-01-19 22:28:09','2026-01-19 22:28:09'),(31,'2026-01-19','FACTURA - 0001-0000001',14000.00,0.00,1,1,6,1,'2026-01-19 22:30:41','2026-01-19 22:30:41');
/*!40000 ALTER TABLE `compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `compras_cta_cte`
--

DROP TABLE IF EXISTS `compras_cta_cte`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `compras_cta_cte` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `devolucion_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `importe` decimal(8,2) NOT NULL,
  `metodo_pago` varchar(255) DEFAULT NULL,
  `tipo` varchar(20) NOT NULL,
  `fecha` date NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `compras_cta_cte_venta_id_unique` (`venta_id`),
  KEY `compras_cta_cte_cliente_id_foreign` (`cliente_id`),
  KEY `compras_cta_cte_empresa_id_foreign` (`empresa_id`),
  KEY `compras_cta_cte_devolucion_id_foreign` (`devolucion_id`),
  CONSTRAINT `compras_cta_cte_cliente_id_foreign` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_cta_cte_devolucion_id_foreign` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE SET NULL,
  CONSTRAINT `compras_cta_cte_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `compras_cta_cte_venta_id_foreign` FOREIGN KEY (`venta_id`) REFERENCES `ventas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `compras_cta_cte`
--

LOCK TABLES `compras_cta_cte` WRITE;
/*!40000 ALTER TABLE `compras_cta_cte` DISABLE KEYS */;
INSERT INTO `compras_cta_cte` VALUES (1,5,NULL,3,13700.00,NULL,'deuda','2026-01-05',1,1,'2026-01-11 18:55:30','2026-01-11 18:55:30'),(2,21,NULL,5,20200.00,NULL,'deuda','2026-01-11',1,1,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(3,NULL,NULL,3,3000.00,'efectivo','pago','2026-01-12',1,1,'2026-01-12 14:57:26','2026-01-12 14:57:26'),(4,NULL,NULL,5,2200.00,'efectivo','pago','2026-01-12',1,2,'2026-01-12 19:13:43','2026-01-12 19:13:43'),(5,76,NULL,6,7100.00,NULL,'deuda','2026-01-16',1,1,'2026-01-16 23:09:35','2026-01-16 23:09:35'),(6,77,NULL,4,5700.00,NULL,'deuda','2026-01-16',1,1,'2026-01-16 23:10:47','2026-01-16 23:10:47'),(7,78,NULL,2,8700.00,NULL,'deuda','2026-01-16',1,1,'2026-01-16 23:21:22','2026-01-16 23:21:22'),(8,101,NULL,4,10900.00,NULL,'deuda','2026-01-17',1,2,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(9,102,NULL,6,5700.00,NULL,'deuda','2026-01-17',1,2,'2026-01-17 20:48:57','2026-01-17 20:48:57'),(10,NULL,NULL,2,8700.00,'efectivo','pago','2026-01-19',1,2,'2026-01-19 16:47:29','2026-01-19 16:47:29');
/*!40000 ALTER TABLE `compras_cta_cte` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_comisiones_pagos`
--

DROP TABLE IF EXISTS `config_comisiones_pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config_comisiones_pagos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `metodo` enum('tarjeta','mercadopago','transferencia','billetera') NOT NULL,
  `comision_porcentaje` decimal(5,2) DEFAULT 0.00,
  `costo_fijo` decimal(10,2) DEFAULT 0.00,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `config_comisiones_pagos_ibfk_1` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_comisiones_pagos`
--

LOCK TABLES `config_comisiones_pagos` WRITE;
/*!40000 ALTER TABLE `config_comisiones_pagos` DISABLE KEYS */;
INSERT INTO `config_comisiones_pagos` VALUES (1,1,'tarjeta',3.50,0.00,'2026-01-16 17:20:01'),(2,1,'mercadopago',5.99,0.00,'2026-01-16 15:58:57'),(3,1,'transferencia',0.00,0.00,'2026-01-16 15:58:57'),(4,1,'billetera',0.00,0.00,'2026-01-16 15:58:57');
/*!40000 ALTER TABLE `config_comisiones_pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `config_sessions`
--

DROP TABLE IF EXISTS `config_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `config_sessions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unidad` enum('minutos','horas','dias') NOT NULL,
  `cantidad` int(11) NOT NULL,
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `config_sessions`
--

LOCK TABLES `config_sessions` WRITE;
/*!40000 ALTER TABLE `config_sessions` DISABLE KEYS */;
INSERT INTO `config_sessions` VALUES (1,'horas',24,'2026-01-10 17:14:59');
/*!40000 ALTER TABLE `config_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_compras`
--

DROP TABLE IF EXISTS `detalle_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `precio_compra` decimal(12,2) DEFAULT 0.00,
  `compra_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_compras_compra_id_foreign` (`compra_id`),
  KEY `detalle_compras_producto_id_foreign` (`producto_id`),
  CONSTRAINT `detalle_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `detalle_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=41 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_compras`
--

LOCK TABLES `detalle_compras` WRITE;
/*!40000 ALTER TABLE `detalle_compras` DISABLE KEYS */;
INSERT INTO `detalle_compras` VALUES (1,10,1750.00,1,4,'2026-01-11 16:52:25','2026-01-11 16:52:25'),(2,10,750.00,2,16,'2026-01-11 16:53:12','2026-01-11 16:53:12'),(3,10,2000.00,3,31,'2026-01-11 17:41:26','2026-01-11 17:41:26'),(6,1,2100.00,7,20,'2026-01-14 22:03:31','2026-01-14 22:03:31'),(7,250,5.80,8,13,'2026-01-15 15:12:50','2026-01-15 15:12:50'),(8,250,5.80,8,12,'2026-01-15 15:12:50','2026-01-15 15:12:50'),(9,250,5.80,9,12,'2026-01-15 15:44:20','2026-01-15 15:44:20'),(10,250,5.80,9,13,'2026-01-15 15:44:20','2026-01-15 15:44:20'),(11,250,5.80,10,12,'2026-01-15 15:51:44','2026-01-15 15:51:44'),(12,250,5.80,10,13,'2026-01-15 15:51:44','2026-01-15 15:51:44'),(13,10,2300.00,11,20,'2026-01-15 22:59:24','2026-01-15 22:59:24'),(14,10,2300.00,12,20,'2026-01-16 13:34:37','2026-01-16 13:34:37'),(15,10,1200.00,13,27,'2026-01-16 13:36:47','2026-01-16 13:36:47'),(16,10,1500.00,14,15,'2026-01-16 22:42:47','2026-01-16 22:42:47'),(17,10,1500.00,15,15,'2026-01-16 22:45:05','2026-01-16 22:45:05'),(18,20,1750.00,16,4,'2026-01-16 23:07:51','2026-01-16 23:07:51'),(19,10,1000.00,17,4,'2026-01-17 01:06:59','2026-01-17 01:06:59'),(20,10,1750.00,18,4,'2026-01-17 01:11:07','2026-01-17 01:11:07'),(21,50,1050.00,19,35,'2026-01-17 17:14:41','2026-01-17 17:14:41'),(22,50,1050.00,19,34,'2026-01-17 17:14:41','2026-01-17 17:14:41'),(23,90,1800.00,20,9,'2026-01-17 19:43:19','2026-01-17 19:43:19'),(24,50,1100.00,21,42,'2026-01-18 00:29:07','2026-01-18 00:29:07'),(25,50,1100.00,21,43,'2026-01-18 00:29:07','2026-01-18 00:29:07'),(26,10,1000.00,22,42,'2026-01-18 00:31:27','2026-01-18 00:31:27'),(27,10,1000.00,22,43,'2026-01-18 00:31:27','2026-01-18 00:31:27'),(28,20,1600.00,23,44,'2026-01-18 02:53:41','2026-01-18 02:53:41'),(29,10,1500.00,24,44,'2026-01-18 02:54:41','2026-01-18 02:54:41'),(30,50,1500.00,25,36,'2026-01-18 03:15:46','2026-01-18 03:15:46'),(31,50,1150.00,25,37,'2026-01-18 03:15:46','2026-01-18 03:15:46'),(32,30,600.00,26,41,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(33,30,600.00,26,39,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(34,30,800.00,26,40,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(35,30,1100.00,26,38,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(36,10,1500.00,27,44,'2026-01-19 15:41:02','2026-01-19 15:41:02'),(37,10,1400.00,28,44,'2026-01-19 16:29:47','2026-01-19 16:29:47'),(38,50,1750.00,29,45,'2026-01-19 22:24:31','2026-01-19 22:24:31'),(39,20,1100.00,30,28,'2026-01-19 22:28:09','2026-01-19 22:28:09'),(40,20,700.00,31,1,'2026-01-19 22:30:41','2026-01-19 22:30:41');
/*!40000 ALTER TABLE `detalle_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_devoluciones`
--

DROP TABLE IF EXISTS `detalle_devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_devoluciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `devolucion_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_devoluciones_devolucion_id_foreign` (`devolucion_id`),
  KEY `detalle_devoluciones_producto_id_foreign` (`producto_id`),
  KEY `detalle_devoluciones_combo_id_foreign` (`combo_id`),
  CONSTRAINT `fk_det_devoluciones_cabecera` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_det_devoluciones_combos` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_det_devoluciones_productos` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_devoluciones`
--

LOCK TABLES `detalle_devoluciones` WRITE;
/*!40000 ALTER TABLE `detalle_devoluciones` DISABLE KEYS */;
INSERT INTO `detalle_devoluciones` VALUES (1,1,1,15,NULL,'2026-01-11 19:43:09','2026-01-11 19:43:09');
/*!40000 ALTER TABLE `detalle_devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ordenes_compra`
--

DROP TABLE IF EXISTS `detalle_ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_ordenes_compra` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `orden_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `cantidad_pedida` int(11) NOT NULL,
  `cantidad_recibida` int(11) DEFAULT 0,
  `precio_estimado` decimal(18,2) DEFAULT 0.00,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ordenes_compra`
--

LOCK TABLES `detalle_ordenes_compra` WRITE;
/*!40000 ALTER TABLE `detalle_ordenes_compra` DISABLE KEYS */;
INSERT INTO `detalle_ordenes_compra` VALUES (1,1,17,10,10,1200.00),(2,2,27,10,10,1200.00),(3,3,35,50,50,1050.00),(4,3,34,50,50,1050.00),(5,4,9,100,90,1800.00),(6,5,31,20,20,2000.00),(7,6,42,50,50,1100.00),(8,6,43,50,50,1100.00),(9,7,44,20,20,1600.00),(10,8,36,50,50,1500.00),(11,8,37,50,50,1150.00),(12,9,41,30,30,600.00),(13,9,39,30,30,600.00),(14,9,40,30,30,800.00),(15,9,38,30,30,1100.00),(16,10,44,10,10,1500.00),(17,11,44,10,10,1500.00),(18,12,45,50,50,1750.00),(19,13,28,20,20,1100.00),(20,14,1,20,20,700.00);
/*!40000 ALTER TABLE `detalle_ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `detalle_ventas`
--

DROP TABLE IF EXISTS `detalle_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `detalle_ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `venta_id` bigint(20) unsigned NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `precio_compra` decimal(18,2) DEFAULT 0.00,
  `precio_venta` decimal(18,2) DEFAULT 0.00,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `detalle_ventas_venta_id_foreign` (`venta_id`),
  KEY `detalle_ventas_producto_id_foreign` (`producto_id`),
  KEY `detalle_ventas_combo_id_foreign` (`combo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=395 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `detalle_ventas`
--

LOCK TABLES `detalle_ventas` WRITE;
/*!40000 ALTER TABLE `detalle_ventas` DISABLE KEYS */;
INSERT INTO `detalle_ventas` VALUES (1,1,1,15,NULL,1500.00,3000.00,'2026-01-11 16:54:08','2026-01-11 16:54:08'),(2,1,1,9,NULL,1800.00,3600.00,'2026-01-11 16:54:08','2026-01-11 16:54:08'),(3,1,1,4,NULL,1550.00,3100.00,'2026-01-11 16:54:08','2026-01-11 16:54:08'),(4,1,2,31,NULL,2000.00,4000.00,'2026-01-11 17:47:02','2026-01-11 17:47:02'),(5,1,2,15,NULL,1500.00,3000.00,'2026-01-11 17:47:02','2026-01-11 17:47:02'),(6,1,2,9,NULL,1800.00,3600.00,'2026-01-11 17:47:02','2026-01-11 17:47:02'),(7,1,2,4,NULL,1550.00,3100.00,'2026-01-11 17:47:02','2026-01-11 17:47:02'),(8,1,2,24,NULL,1650.00,3300.00,'2026-01-11 17:47:02','2026-01-11 17:47:02'),(9,1,3,4,NULL,1550.00,3100.00,'2026-01-11 18:18:06','2026-01-11 18:18:06'),(10,1,3,16,NULL,750.00,1500.00,'2026-01-11 18:18:06','2026-01-11 18:18:06'),(11,2,3,10,NULL,600.00,1200.00,'2026-01-11 18:18:06','2026-01-11 18:18:06'),(12,1,4,15,NULL,1500.00,3000.00,'2026-01-11 18:38:13','2026-01-11 18:38:13'),(13,1,4,32,NULL,1500.00,3000.00,'2026-01-11 18:38:13','2026-01-11 18:38:13'),(14,1,5,31,NULL,2000.00,4000.00,'2026-01-11 18:55:30','2026-01-11 18:55:30'),(15,1,5,15,NULL,1500.00,3000.00,'2026-01-11 18:55:30','2026-01-11 18:55:30'),(16,1,5,9,NULL,1800.00,3600.00,'2026-01-11 18:55:30','2026-01-11 18:55:30'),(17,1,5,4,NULL,1550.00,3100.00,'2026-01-11 18:55:30','2026-01-11 18:55:30'),(18,1,6,16,NULL,750.00,1500.00,'2026-01-11 19:03:43','2026-01-11 19:03:43'),(19,1,6,9,NULL,1800.00,3600.00,'2026-01-11 19:03:43','2026-01-11 19:03:43'),(20,1,6,1,NULL,700.00,1400.00,'2026-01-11 19:03:43','2026-01-11 19:03:43'),(21,1,7,9,NULL,1800.00,3600.00,'2026-01-11 19:05:26','2026-01-11 19:05:26'),(22,1,7,1,NULL,700.00,1400.00,'2026-01-11 19:05:26','2026-01-11 19:05:26'),(23,1,8,31,NULL,2000.00,4000.00,'2026-01-11 19:17:09','2026-01-11 19:17:09'),(24,1,8,15,NULL,1500.00,3000.00,'2026-01-11 19:17:09','2026-01-11 19:17:09'),(25,1,8,9,NULL,1800.00,3600.00,'2026-01-11 19:17:09','2026-01-11 19:17:09'),(26,1,8,4,NULL,1550.00,3100.00,'2026-01-11 19:17:09','2026-01-11 19:17:09'),(27,1,8,16,NULL,750.00,1500.00,'2026-01-11 19:17:09','2026-01-11 19:17:09'),(28,1,9,1,NULL,700.00,1400.00,'2026-01-11 19:32:43','2026-01-11 19:32:43'),(29,1,9,10,NULL,600.00,1200.00,'2026-01-11 19:32:43','2026-01-11 19:32:43'),(30,1,9,23,NULL,600.00,1200.00,'2026-01-11 19:32:43','2026-01-11 19:32:43'),(31,1,9,10,NULL,600.00,1200.00,'2026-01-11 19:32:43','2026-01-11 19:32:43'),(32,1,10,33,NULL,2300.00,4600.00,'2026-01-11 19:36:03','2026-01-11 19:36:03'),(33,1,10,2,NULL,605.00,1210.00,'2026-01-11 19:36:03','2026-01-11 19:36:03'),(34,1,10,30,NULL,1500.00,3000.00,'2026-01-11 19:36:03','2026-01-11 19:36:03'),(35,1,11,24,NULL,1650.00,3300.00,'2026-01-11 19:37:14','2026-01-11 19:37:14'),(36,1,11,18,NULL,1350.00,2700.00,'2026-01-11 19:37:14','2026-01-11 19:37:14'),(37,1,11,17,NULL,825.00,1650.00,'2026-01-11 19:37:14','2026-01-11 19:37:14'),(38,1,11,16,NULL,750.00,1500.00,'2026-01-11 19:37:14','2026-01-11 19:37:14'),(39,1,12,15,NULL,1500.00,3000.00,'2026-01-11 19:41:34','2026-01-11 19:41:34'),(40,1,13,31,NULL,2000.00,4000.00,'2026-01-11 19:44:29','2026-01-11 19:44:29'),(41,1,13,15,NULL,1500.00,3000.00,'2026-01-11 19:44:29','2026-01-11 19:44:29'),(42,1,13,32,NULL,1500.00,3000.00,'2026-01-11 19:44:29','2026-01-11 19:44:29'),(43,1,14,1,NULL,700.00,1400.00,'2026-01-11 19:46:08','2026-01-11 19:46:08'),(44,1,14,NULL,3,2900.00,5800.00,'2026-01-11 19:46:08','2026-01-11 19:46:08'),(45,1,15,NULL,3,2900.00,5800.00,'2026-01-11 19:51:54','2026-01-11 19:51:54'),(46,1,16,NULL,3,2900.00,5800.00,'2026-01-11 19:56:55','2026-01-11 19:56:55'),(47,1,17,3,NULL,660.00,1320.00,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(48,1,17,5,NULL,9600.00,14400.00,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(49,1,17,7,NULL,605.00,1210.00,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(50,1,17,8,NULL,605.00,1210.00,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(51,1,17,11,NULL,660.00,1320.00,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(52,1,17,14,NULL,1725.00,3450.00,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(53,1,18,6,NULL,800.00,1600.00,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(54,1,18,19,NULL,1707.75,3415.50,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(55,1,18,20,NULL,675.00,1350.00,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(56,1,18,21,NULL,1300.00,2600.00,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(57,1,19,22,NULL,3350.00,6700.00,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(58,1,19,27,NULL,1200.00,2400.00,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(59,1,19,28,NULL,1100.00,2200.00,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(60,1,20,31,NULL,2000.00,4000.00,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(61,1,20,15,NULL,1500.00,3000.00,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(62,1,20,32,NULL,1500.00,3000.00,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(63,1,21,4,NULL,1550.00,3100.00,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(64,1,21,5,NULL,9600.00,14400.00,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(65,1,21,18,NULL,1350.00,2700.00,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(66,1,22,4,NULL,1550.00,3100.00,'2026-01-12 15:19:14','2026-01-12 15:19:14'),(67,1,23,4,NULL,1750.00,3500.00,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(68,1,23,9,NULL,1800.00,3600.00,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(69,1,23,10,NULL,600.00,1200.00,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(70,1,23,28,NULL,1100.00,2200.00,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(71,1,24,4,NULL,1750.00,3500.00,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(72,1,24,14,NULL,1750.00,3500.00,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(73,1,24,8,NULL,900.00,1800.00,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(74,1,24,2,NULL,900.00,1800.00,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(75,1,24,23,NULL,600.00,1200.00,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(76,1,24,10,NULL,600.00,1200.00,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(77,1,25,31,NULL,2000.00,4000.00,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(78,1,25,9,NULL,1800.00,3600.00,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(79,1,25,1,NULL,700.00,1400.00,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(80,1,25,30,NULL,1500.00,3000.00,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(81,2,26,4,NULL,1750.00,3500.00,'2026-01-12 19:09:00','2026-01-12 19:09:00'),(82,1,27,4,NULL,1750.00,3500.00,'2026-01-12 20:24:15','2026-01-12 20:24:15'),(83,1,27,15,NULL,1500.00,3000.00,'2026-01-12 20:24:15','2026-01-12 20:24:15'),(84,1,28,4,NULL,1750.00,3500.00,'2026-01-12 20:27:20','2026-01-12 20:27:20'),(85,1,28,9,NULL,1800.00,3600.00,'2026-01-12 20:27:20','2026-01-12 20:27:20'),(86,1,29,4,NULL,1750.00,3500.00,'2026-01-13 00:04:36','2026-01-13 00:04:36'),(87,1,29,14,NULL,1750.00,3500.00,'2026-01-13 00:04:36','2026-01-13 00:04:36'),(88,1,30,15,NULL,1500.00,3000.00,'2026-01-13 00:06:56','2026-01-13 00:06:56'),(89,3,31,9,NULL,1800.00,3600.00,'2026-01-13 01:38:46','2026-01-13 01:38:46'),(90,1,32,1,NULL,700.00,1400.00,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(91,1,32,11,NULL,950.00,1900.00,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(92,1,32,10,NULL,600.00,1200.00,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(93,1,32,14,NULL,1750.00,3500.00,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(94,2,33,4,NULL,1750.00,3500.00,'2026-01-13 18:15:32','2026-01-13 18:15:32'),(95,1,34,14,NULL,1750.00,3500.00,'2026-01-13 21:10:16','2026-01-13 21:10:16'),(96,1,34,NULL,3,2900.00,5800.00,'2026-01-13 21:10:16','2026-01-13 21:10:16'),(97,2,35,4,NULL,1750.00,3500.00,'2026-01-13 21:11:40','2026-01-13 21:11:40'),(98,1,36,31,NULL,2000.00,4000.00,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(99,1,36,15,NULL,1500.00,3000.00,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(100,1,36,32,NULL,1500.00,3000.00,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(101,1,37,1,NULL,700.00,1400.00,'2026-01-13 23:40:24','2026-01-13 23:40:24'),(102,1,37,11,NULL,950.00,1900.00,'2026-01-13 23:40:24','2026-01-13 23:40:24'),(103,1,37,10,NULL,600.00,1200.00,'2026-01-13 23:40:24','2026-01-13 23:40:24'),(104,1,38,31,NULL,2000.00,4000.00,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(105,1,38,15,NULL,1500.00,3000.00,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(106,1,38,32,NULL,1500.00,3000.00,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(107,2,39,4,NULL,1750.00,3500.00,'2026-01-14 14:37:46','2026-01-14 14:37:46'),(108,1,39,30,NULL,1500.00,3000.00,'2026-01-14 14:37:46','2026-01-14 14:37:46'),(109,1,40,6,NULL,800.00,1600.00,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(110,1,40,1,NULL,700.00,1400.00,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(111,2,40,4,NULL,1750.00,3500.00,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(112,1,41,29,NULL,500.00,1000.00,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(113,1,41,28,NULL,1100.00,2200.00,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(114,1,41,8,NULL,950.00,1900.00,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(115,1,41,20,NULL,700.00,1400.00,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(116,1,41,14,NULL,1750.00,3500.00,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(117,1,42,33,NULL,2300.00,4600.00,'2026-01-14 16:08:17','2026-01-14 16:08:17'),(118,1,42,19,NULL,2150.00,4300.00,'2026-01-14 16:08:17','2026-01-14 16:08:17'),(119,1,43,23,NULL,600.00,1200.00,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(120,1,43,19,NULL,2150.00,4300.00,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(121,1,43,14,NULL,1750.00,3500.00,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(122,1,44,31,NULL,2000.00,4000.00,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(123,1,44,32,NULL,1500.00,3000.00,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(124,2,44,16,NULL,750.00,1500.00,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(125,2,45,4,NULL,1750.00,3500.00,'2026-01-14 16:45:47','2026-01-14 16:45:47'),(126,1,45,15,NULL,1500.00,3000.00,'2026-01-14 16:45:47','2026-01-14 16:45:47'),(127,2,46,4,NULL,1750.00,3500.00,'2026-01-14 16:56:25','2026-01-14 16:56:25'),(128,2,46,16,NULL,750.00,1500.00,'2026-01-14 16:56:25','2026-01-14 16:56:25'),(129,2,47,4,NULL,1750.00,3500.00,'2026-01-14 17:06:01','2026-01-14 17:06:01'),(130,2,47,16,NULL,750.00,1500.00,'2026-01-14 17:06:01','2026-01-14 17:06:01'),(131,2,48,32,NULL,1500.00,3000.00,'2026-01-14 17:12:07','2026-01-14 17:12:07'),(132,1,49,15,NULL,1500.00,3000.00,'2026-01-14 17:17:36','2026-01-14 17:17:36'),(133,2,49,4,NULL,1750.00,3500.00,'2026-01-14 17:17:36','2026-01-14 17:17:36'),(134,1,50,20,NULL,700.00,1400.00,'2026-01-14 17:30:09','2026-01-14 17:30:09'),(135,1,50,6,NULL,800.00,1600.00,'2026-01-14 17:30:09','2026-01-14 17:30:09'),(136,2,53,14,NULL,1750.00,3500.00,'2026-01-14 18:13:09','2026-01-14 18:13:09'),(137,2,54,4,NULL,1750.00,3500.00,'2026-01-14 18:23:04','2026-01-14 18:23:04'),(138,1,54,15,NULL,1500.00,3000.00,'2026-01-14 18:23:04','2026-01-14 18:23:04'),(139,1,55,15,NULL,1500.00,3000.00,'2026-01-14 18:29:32','2026-01-14 18:29:32'),(140,2,55,4,NULL,1750.00,3500.00,'2026-01-14 18:29:32','2026-01-14 18:29:32'),(141,2,56,4,NULL,1750.00,3500.00,'2026-01-14 19:37:46','2026-01-14 19:37:46'),(142,2,58,4,NULL,1750.00,3500.00,'2026-01-14 19:45:53','2026-01-14 19:45:53'),(143,2,59,15,NULL,1500.00,3000.00,'2026-01-14 19:49:39','2026-01-14 19:49:39'),(144,1,60,14,NULL,1750.00,3500.00,'2026-01-14 19:53:16','2026-01-14 19:53:16'),(145,1,61,15,NULL,1500.00,3000.00,'2026-01-14 19:59:49','2026-01-14 19:59:49'),(146,1,62,32,NULL,1500.00,3000.00,'2026-01-14 20:52:31','2026-01-14 20:52:31'),(147,1,63,NULL,3,2900.00,5800.00,'2026-01-15 14:09:22','2026-01-15 14:09:22'),(148,1,64,31,NULL,2000.00,4000.00,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(149,1,64,15,NULL,1500.00,3000.00,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(150,2,64,4,NULL,1750.00,3500.00,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(151,1,65,14,NULL,1750.00,3500.00,'2026-01-15 15:03:22','2026-01-15 15:03:22'),(152,1,65,NULL,3,2900.00,5800.00,'2026-01-15 15:03:22','2026-01-15 15:03:22'),(153,1,66,1,NULL,700.00,1400.00,'2026-01-15 15:05:56','2026-01-15 15:05:56'),(154,1,66,10,NULL,600.00,1200.00,'2026-01-15 15:05:56','2026-01-15 15:05:56'),(155,1,66,16,NULL,750.00,1500.00,'2026-01-15 15:05:56','2026-01-15 15:05:56'),(156,1,67,NULL,3,2900.00,5800.00,'2026-01-15 15:36:46','2026-01-15 15:36:46'),(157,1,67,16,NULL,750.00,1500.00,'2026-01-15 15:36:46','2026-01-15 15:36:46'),(158,1,68,NULL,3,2900.00,5800.00,'2026-01-15 15:46:02','2026-01-15 15:46:02'),(159,1,69,NULL,3,2900.00,5800.00,'2026-01-15 15:52:36','2026-01-15 15:52:36'),(160,1,69,4,NULL,1750.00,3500.00,'2026-01-15 15:52:36','2026-01-15 15:52:36'),(161,1,70,29,NULL,500.00,1000.00,'2026-01-15 15:55:51','2026-01-15 15:55:51'),(162,1,70,1,NULL,700.00,1400.00,'2026-01-15 15:55:51','2026-01-15 15:55:51'),(163,1,70,7,NULL,900.00,2700.00,'2026-01-15 15:55:51','2026-01-15 15:55:51'),(164,2,71,4,NULL,1750.00,3500.00,'2026-01-16 18:02:41','2026-01-16 18:02:41'),(165,1,71,30,NULL,1500.00,3000.00,'2026-01-16 18:02:41','2026-01-16 18:02:41'),(166,2,73,1,NULL,700.00,1400.00,'2026-01-16 18:25:44','2026-01-16 18:25:44'),(167,1,73,33,NULL,2300.00,4600.00,'2026-01-16 18:25:44','2026-01-16 18:25:44'),(168,1,73,22,NULL,3350.00,6700.00,'2026-01-16 18:25:44','2026-01-16 18:25:44'),(169,1,74,15,NULL,1500.00,3000.00,'2026-01-16 18:31:58','2026-01-16 18:31:58'),(170,2,74,4,NULL,1750.00,3500.00,'2026-01-16 18:31:58','2026-01-16 18:31:58'),(171,1,75,1,NULL,700.00,1400.00,'2026-01-16 19:47:29','2026-01-16 19:47:29'),(172,2,75,3,NULL,950.00,1900.00,'2026-01-16 19:47:29','2026-01-16 19:47:29'),(173,1,76,9,NULL,1800.00,3600.00,'2026-01-16 23:09:35','2026-01-16 23:09:35'),(174,1,76,4,NULL,1750.00,3500.00,'2026-01-16 23:09:35','2026-01-16 23:09:35'),(175,1,77,28,NULL,1100.00,2200.00,'2026-01-16 23:10:47','2026-01-16 23:10:47'),(176,1,77,14,NULL,1750.00,3500.00,'2026-01-16 23:10:47','2026-01-16 23:10:47'),(177,1,78,19,NULL,2600.00,5200.00,'2026-01-16 23:21:22','2026-01-16 23:21:22'),(178,1,78,4,NULL,1750.00,3500.00,'2026-01-16 23:21:22','2026-01-16 23:21:22'),(179,1,79,15,NULL,1500.00,3000.00,'2026-01-17 01:25:44','2026-01-17 01:25:44'),(180,2,79,4,NULL,1750.00,3500.00,'2026-01-17 01:25:44','2026-01-17 01:25:44'),(181,1,80,1,NULL,700.00,1400.00,'2026-01-17 01:44:48','2026-01-17 01:44:48'),(182,1,80,20,NULL,2300.00,4600.00,'2026-01-17 01:44:48','2026-01-17 01:44:48'),(183,1,81,15,NULL,1500.00,3000.00,'2026-01-17 02:04:28','2026-01-17 02:04:28'),(184,2,81,4,NULL,1750.00,3500.00,'2026-01-17 02:04:28','2026-01-17 02:04:28'),(185,1,82,15,NULL,1500.00,3000.00,'2026-01-17 02:05:49','2026-01-17 02:05:49'),(186,2,82,4,NULL,1750.00,3500.00,'2026-01-17 02:05:49','2026-01-17 02:05:49'),(187,2,83,14,NULL,1750.00,3500.00,'2026-01-17 02:16:48','2026-01-17 02:16:48'),(188,1,83,32,NULL,1500.00,3000.00,'2026-01-17 02:16:48','2026-01-17 02:16:48'),(189,2,84,4,NULL,1750.00,3500.00,'2026-01-17 02:17:32','2026-01-17 02:17:32'),(190,1,84,17,NULL,1500.00,3000.00,'2026-01-17 02:17:32','2026-01-17 02:17:32'),(191,1,85,15,NULL,1500.00,3000.00,'2026-01-17 06:35:02','2026-01-17 06:35:02'),(192,2,85,4,NULL,1750.00,3500.00,'2026-01-17 06:35:02','2026-01-17 06:35:02'),(193,1,86,NULL,3,2900.00,5800.00,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(194,1,86,4,NULL,1750.00,3500.00,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(195,1,86,14,NULL,1750.00,3500.00,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(196,1,87,4,NULL,1750.00,3500.00,'2026-01-17 15:32:19','2026-01-17 15:32:19'),(197,1,87,16,NULL,750.00,1500.00,'2026-01-17 15:32:19','2026-01-17 15:32:19'),(198,1,88,9,NULL,1800.00,3600.00,'2026-01-17 16:34:40','2026-01-17 16:34:40'),(199,1,88,24,NULL,1650.00,3300.00,'2026-01-17 16:34:40','2026-01-17 16:34:40'),(200,1,89,9,NULL,1800.00,3600.00,'2026-01-17 17:16:40','2026-01-17 17:16:40'),(201,1,89,34,NULL,1050.00,2100.00,'2026-01-17 17:16:40','2026-01-17 17:16:40'),(202,1,90,35,NULL,1050.00,2100.00,'2026-01-17 17:47:57','2026-01-17 17:47:57'),(203,1,90,30,NULL,1500.00,3000.00,'2026-01-17 17:47:57','2026-01-17 17:47:57'),(204,1,91,18,NULL,1350.00,2700.00,'2026-01-17 17:48:39','2026-01-17 17:48:39'),(205,1,91,17,NULL,1500.00,3000.00,'2026-01-17 17:48:39','2026-01-17 17:48:39'),(206,1,92,9,NULL,1800.00,3600.00,'2026-01-17 17:49:18','2026-01-17 17:49:18'),(207,1,92,34,NULL,1050.00,2100.00,'2026-01-17 17:49:18','2026-01-17 17:49:18'),(208,1,93,33,NULL,2300.00,4600.00,'2026-01-17 17:59:13','2026-01-17 17:59:13'),(209,1,93,15,NULL,1500.00,3000.00,'2026-01-17 17:59:13','2026-01-17 17:59:13'),(210,1,94,1,NULL,700.00,1400.00,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(211,1,94,10,NULL,600.00,1200.00,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(212,1,94,1,NULL,700.00,1400.00,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(213,1,95,9,NULL,1800.00,3600.00,'2026-01-17 18:47:17','2026-01-17 18:47:17'),(214,1,95,34,NULL,1050.00,2100.00,'2026-01-17 18:47:17','2026-01-17 18:47:17'),(215,1,96,9,NULL,1800.00,3600.00,'2026-01-17 18:48:34','2026-01-17 18:48:34'),(216,1,96,34,NULL,1050.00,2100.00,'2026-01-17 18:48:34','2026-01-17 18:48:34'),(217,1,97,9,NULL,1800.00,3600.00,'2026-01-17 18:49:37','2026-01-17 18:49:37'),(218,1,97,34,NULL,1050.00,2100.00,'2026-01-17 18:49:37','2026-01-17 18:49:37'),(219,1,97,11,NULL,950.00,1900.00,'2026-01-17 18:49:37','2026-01-17 18:49:37'),(220,1,98,9,NULL,1800.00,3600.00,'2026-01-17 20:37:41','2026-01-17 20:37:41'),(221,1,98,34,NULL,1050.00,2100.00,'2026-01-17 20:37:41','2026-01-17 20:37:41'),(222,1,99,29,NULL,500.00,1000.00,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(223,1,99,8,NULL,1200.00,2400.00,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(224,1,99,9,NULL,1800.00,3600.00,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(225,1,99,34,NULL,1050.00,2100.00,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(226,1,100,20,NULL,2300.00,4600.00,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(227,1,100,33,NULL,2300.00,4600.00,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(228,1,100,34,NULL,1050.00,2100.00,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(229,1,100,9,NULL,1800.00,3600.00,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(230,1,101,11,NULL,950.00,1900.00,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(231,1,101,24,NULL,1650.00,3300.00,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(232,1,101,34,NULL,1050.00,2100.00,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(233,1,101,9,NULL,1800.00,3600.00,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(234,1,102,9,NULL,1800.00,3600.00,'2026-01-17 20:48:57','2026-01-17 20:48:57'),(235,1,102,34,NULL,1050.00,2100.00,'2026-01-17 20:48:57','2026-01-17 20:48:57'),(236,1,103,NULL,5,2850.00,5000.00,'2026-01-17 22:16:38','2026-01-17 22:16:38'),(237,1,103,17,NULL,1500.00,3000.00,'2026-01-17 22:16:38','2026-01-17 22:16:38'),(238,1,104,20,NULL,2300.00,4600.00,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(239,1,104,8,NULL,1200.00,2400.00,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(240,1,104,5,NULL,9600.00,14400.00,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(241,1,104,3,NULL,1500.00,3000.00,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(242,1,104,6,NULL,800.00,1600.00,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(243,1,105,34,NULL,1050.00,2100.00,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(244,1,105,9,NULL,1800.00,3600.00,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(245,1,105,1,NULL,700.00,1400.00,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(246,2,105,39,NULL,600.00,1200.00,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(247,1,105,17,NULL,1500.00,3000.00,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(248,1,105,40,NULL,800.00,1600.00,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(249,1,106,16,NULL,750.00,1500.00,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(250,1,106,42,NULL,1000.00,2000.00,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(251,1,106,36,NULL,1500.00,3000.00,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(252,1,106,38,NULL,1100.00,2200.00,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(253,1,106,44,NULL,1500.00,3000.00,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(254,1,106,41,NULL,600.00,1200.00,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(255,1,107,38,NULL,1100.00,2200.00,'2026-01-18 13:57:14','2026-01-18 13:57:14'),(256,1,107,27,NULL,1200.00,2400.00,'2026-01-18 13:57:14','2026-01-18 13:57:14'),(257,1,108,NULL,3,2900.00,5800.00,'2026-01-18 14:12:10','2026-01-18 14:12:10'),(258,1,109,NULL,5,2850.00,5000.00,'2026-01-18 15:30:34','2026-01-18 15:30:34'),(259,1,109,32,NULL,1500.00,3000.00,'2026-01-18 15:30:34','2026-01-18 15:30:34'),(260,1,110,28,NULL,1100.00,2200.00,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(261,1,110,38,NULL,1100.00,2200.00,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(262,2,110,41,NULL,600.00,1200.00,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(263,1,111,14,NULL,1750.00,3500.00,'2026-01-18 17:33:59','2026-01-18 17:33:59'),(264,1,111,3,NULL,1500.00,3000.00,'2026-01-18 17:33:59','2026-01-18 17:33:59'),(265,2,112,4,NULL,1750.00,3500.00,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(266,1,112,16,NULL,750.00,1500.00,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(267,2,112,39,NULL,600.00,1200.00,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(268,1,113,44,NULL,1500.00,3000.00,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(269,1,113,4,NULL,1750.00,3500.00,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(270,1,113,1,NULL,700.00,1400.00,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(271,2,114,4,NULL,1750.00,3500.00,'2026-01-18 17:39:45','2026-01-18 17:39:45'),(272,1,114,14,NULL,1750.00,3500.00,'2026-01-18 17:39:45','2026-01-18 17:39:45'),(273,1,115,42,NULL,1000.00,2000.00,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(274,1,115,9,NULL,1800.00,3600.00,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(275,1,115,4,NULL,1750.00,3500.00,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(276,1,116,10,NULL,600.00,1200.00,'2026-01-18 18:22:16','2026-01-18 18:22:16'),(277,1,116,14,NULL,1750.00,3500.00,'2026-01-18 18:22:16','2026-01-18 18:22:16'),(278,1,117,8,NULL,1200.00,2400.00,'2026-01-18 18:28:35','2026-01-18 18:28:35'),(279,1,117,33,NULL,2300.00,4600.00,'2026-01-18 18:28:35','2026-01-18 18:28:35'),(280,1,118,36,NULL,1500.00,3000.00,'2026-01-18 18:33:57','2026-01-18 18:33:57'),(281,1,118,28,NULL,1100.00,2200.00,'2026-01-18 18:33:57','2026-01-18 18:33:57'),(282,1,118,40,NULL,800.00,1600.00,'2026-01-18 18:33:57','2026-01-18 18:33:57'),(283,1,119,38,NULL,1100.00,2200.00,'2026-01-18 19:38:40','2026-01-18 19:38:40'),(284,1,119,18,NULL,1350.00,2700.00,'2026-01-18 19:38:40','2026-01-18 19:38:40'),(285,1,120,10,NULL,600.00,1200.00,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(286,1,120,39,NULL,600.00,1200.00,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(287,1,120,38,NULL,1100.00,2200.00,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(288,1,120,17,NULL,1500.00,3000.00,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(289,1,121,16,NULL,750.00,1500.00,'2026-01-18 21:11:59','2026-01-18 21:11:59'),(290,1,121,6,NULL,800.00,1600.00,'2026-01-18 21:11:59','2026-01-18 21:11:59'),(291,1,121,3,NULL,1500.00,3000.00,'2026-01-18 21:11:59','2026-01-18 21:11:59'),(292,1,122,36,NULL,1500.00,3000.00,'2026-01-18 21:12:39','2026-01-18 21:12:39'),(293,1,122,42,NULL,1000.00,2000.00,'2026-01-18 21:12:39','2026-01-18 21:12:39'),(294,1,122,44,NULL,1500.00,3000.00,'2026-01-18 21:12:39','2026-01-18 21:12:39'),(295,1,123,29,NULL,500.00,1000.00,'2026-01-18 21:13:23','2026-01-18 21:13:23'),(296,1,123,39,NULL,600.00,1200.00,'2026-01-18 21:13:23','2026-01-18 21:13:23'),(297,1,123,35,NULL,1050.00,2100.00,'2026-01-18 21:13:23','2026-01-18 21:13:23'),(298,1,124,32,NULL,1500.00,3000.00,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(299,1,124,38,NULL,1100.00,2200.00,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(300,1,124,2,NULL,1100.00,2200.00,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(301,1,124,40,NULL,800.00,1600.00,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(302,1,125,40,NULL,800.00,1600.00,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(303,1,125,41,NULL,600.00,1200.00,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(304,1,125,42,NULL,1000.00,2000.00,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(305,1,126,NULL,5,2850.00,5000.00,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(306,1,126,28,NULL,1100.00,2200.00,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(307,1,126,11,NULL,950.00,1900.00,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(308,1,127,36,NULL,1500.00,3000.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(309,1,127,42,NULL,1000.00,2000.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(310,1,127,44,NULL,1500.00,3000.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(311,1,127,9,NULL,1800.00,3600.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(312,1,127,38,NULL,1100.00,2200.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(313,1,127,35,NULL,1050.00,2100.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(314,1,127,30,NULL,1500.00,3000.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(315,1,127,33,NULL,2300.00,4600.00,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(316,1,128,44,NULL,1500.00,3000.00,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(317,1,128,1,NULL,700.00,1400.00,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(318,1,128,39,NULL,600.00,1200.00,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(319,1,129,44,NULL,1500.00,3000.00,'2026-01-19 00:51:58','2026-01-19 00:51:58'),(320,1,130,44,NULL,1500.00,3000.00,'2026-01-19 14:14:14','2026-01-19 14:14:14'),(321,1,130,42,NULL,1000.00,2000.00,'2026-01-19 14:14:14','2026-01-19 14:14:14'),(322,1,131,9,NULL,1800.00,3600.00,'2026-01-19 14:31:58','2026-01-19 14:31:58'),(323,1,131,11,NULL,950.00,1900.00,'2026-01-19 14:31:58','2026-01-19 14:31:58'),(324,1,132,NULL,5,2850.00,5000.00,'2026-01-19 14:41:56','2026-01-19 14:41:56'),(325,1,133,44,NULL,1500.00,3000.00,'2026-01-19 14:48:53','2026-01-19 14:48:53'),(326,1,133,41,NULL,600.00,1200.00,'2026-01-19 14:48:53','2026-01-19 14:48:53'),(327,1,134,44,NULL,1500.00,3000.00,'2026-01-19 15:45:30','2026-01-19 15:45:30'),(328,1,134,42,NULL,1000.00,2000.00,'2026-01-19 15:45:30','2026-01-19 15:45:30'),(329,1,135,4,NULL,1750.00,3500.00,'2026-01-19 15:47:15','2026-01-19 15:47:15'),(330,1,135,2,NULL,1100.00,2200.00,'2026-01-19 15:47:15','2026-01-19 15:47:15'),(331,1,135,16,NULL,750.00,1500.00,'2026-01-19 15:47:15','2026-01-19 15:47:15'),(332,1,136,36,NULL,1500.00,3000.00,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(333,1,136,9,NULL,1800.00,3600.00,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(334,1,136,32,NULL,1500.00,3000.00,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(335,1,136,10,NULL,600.00,1200.00,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(336,1,137,15,NULL,1500.00,3000.00,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(337,1,137,4,NULL,1750.00,3500.00,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(338,1,137,32,NULL,1500.00,3000.00,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(339,1,137,28,NULL,1100.00,2200.00,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(340,1,138,4,NULL,1750.00,3500.00,'2026-01-19 16:50:21','2026-01-19 16:50:21'),(341,1,138,NULL,5,2850.00,5000.00,'2026-01-19 16:50:21','2026-01-19 16:50:21'),(342,1,139,4,NULL,1750.00,3500.00,'2026-01-19 17:24:07','2026-01-19 17:24:07'),(343,1,139,NULL,5,2850.00,5000.00,'2026-01-19 17:24:07','2026-01-19 17:24:07'),(344,1,140,15,NULL,1500.00,3000.00,'2026-01-19 17:39:47','2026-01-19 17:39:47'),(345,1,141,44,NULL,1400.00,2800.00,'2026-01-19 17:46:35','2026-01-19 17:46:35'),(346,1,141,28,NULL,1100.00,2200.00,'2026-01-19 17:46:35','2026-01-19 17:46:35'),(347,1,142,15,NULL,1500.00,3000.00,'2026-01-19 18:02:05','2026-01-19 18:02:05'),(348,1,142,32,NULL,1500.00,3000.00,'2026-01-19 18:02:05','2026-01-19 18:02:05'),(349,1,143,15,NULL,1500.00,3000.00,'2026-01-19 18:08:50','2026-01-19 18:08:50'),(350,1,143,32,NULL,1500.00,3000.00,'2026-01-19 18:08:50','2026-01-19 18:08:50'),(351,2,144,4,NULL,1750.00,3500.00,'2026-01-19 18:13:41','2026-01-19 18:13:41'),(352,1,145,44,NULL,1400.00,2800.00,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(353,1,145,15,NULL,1500.00,3000.00,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(354,1,145,10,NULL,600.00,1200.00,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(355,1,146,32,NULL,1500.00,3000.00,'2026-01-19 18:28:26','2026-01-19 18:28:26'),(356,1,147,36,NULL,1500.00,3000.00,'2026-01-19 18:30:39','2026-01-19 18:30:39'),(357,1,148,30,NULL,1500.00,3000.00,'2026-01-19 18:51:27','2026-01-19 18:51:27'),(358,1,149,42,NULL,1000.00,2000.00,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(359,1,149,15,NULL,1500.00,3000.00,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(360,1,149,11,NULL,950.00,1900.00,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(361,1,149,8,NULL,1200.00,2400.00,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(362,1,149,24,NULL,1650.00,3300.00,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(363,1,150,27,NULL,1200.00,2400.00,'2026-01-19 19:46:47','2026-01-19 19:46:47'),(364,1,150,40,NULL,800.00,1600.00,'2026-01-19 19:46:47','2026-01-19 19:46:47'),(365,2,151,4,NULL,1750.00,3500.00,'2026-01-19 19:47:52','2026-01-19 19:47:52'),(366,2,152,4,NULL,1750.00,3500.00,'2026-01-19 19:58:22','2026-01-19 19:58:22'),(367,1,153,36,NULL,1500.00,3000.00,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(368,1,153,1,NULL,700.00,1400.00,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(369,1,153,7,NULL,1100.00,3300.00,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(370,1,153,24,NULL,1650.00,3300.00,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(371,1,154,NULL,5,2850.00,5000.00,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(372,1,154,NULL,4,4700.00,5000.00,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(373,1,155,NULL,3,2900.00,5800.00,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(374,1,155,NULL,5,2850.00,5000.00,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(375,1,155,38,NULL,1100.00,2200.00,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(376,1,156,2,NULL,1100.00,2200.00,'2026-01-19 21:39:37','2026-01-19 21:39:37'),(377,1,156,16,NULL,750.00,1500.00,'2026-01-19 21:39:37','2026-01-19 21:39:37'),(378,1,156,3,NULL,1500.00,3000.00,'2026-01-19 21:39:37','2026-01-19 21:39:37'),(379,1,157,36,NULL,1500.00,3000.00,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(380,1,157,42,NULL,1000.00,2000.00,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(381,1,157,44,NULL,1400.00,2800.00,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(382,1,157,10,NULL,600.00,1200.00,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(383,2,158,4,NULL,1750.00,3500.00,'2026-01-19 21:43:57','2026-01-19 21:43:57'),(384,1,159,5,NULL,9600.00,14400.00,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(385,1,159,3,NULL,1500.00,3000.00,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(386,1,159,18,NULL,1350.00,2700.00,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(387,1,160,36,NULL,1500.00,3000.00,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(388,1,160,15,NULL,1500.00,3000.00,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(389,1,160,9,NULL,1800.00,3600.00,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(390,1,160,29,NULL,500.00,1000.00,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(391,1,161,24,NULL,1650.00,3300.00,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(392,1,161,38,NULL,1100.00,2200.00,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(393,1,161,35,NULL,1050.00,2100.00,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(394,1,161,33,NULL,2300.00,4600.00,'2026-01-19 22:14:16','2026-01-19 22:14:16');
/*!40000 ALTER TABLE `detalle_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `devoluciones`
--

DROP TABLE IF EXISTS `devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `devoluciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `fecha` date NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `motivo` text DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `devoluciones_empresa_id_foreign` (`empresa_id`),
  KEY `devoluciones_cliente_id_foreign` (`cliente_id`),
  KEY `devoluciones_venta_id_foreign` (`venta_id`),
  CONSTRAINT `fk_devoluciones_clientes` FOREIGN KEY (`cliente_id`) REFERENCES `clientes` (`id`) ON UPDATE CASCADE,
  CONSTRAINT `fk_devoluciones_empresas` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `devoluciones`
--

LOCK TABLES `devoluciones` WRITE;
/*!40000 ALTER TABLE `devoluciones` DISABLE KEYS */;
INSERT INTO `devoluciones` VALUES (1,NULL,'2026-01-08',3000.00,'',1,1,NULL,1,'2026-01-11 19:43:09','2026-01-11 19:43:09');
/*!40000 ALTER TABLE `devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `empresas`
--

DROP TABLE IF EXISTS `empresas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `empresas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `pais` varchar(255) NOT NULL,
  `nombre_empresa` varchar(255) NOT NULL,
  `tipo_empresa` varchar(255) NOT NULL,
  `cuit` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `correo` varchar(255) NOT NULL,
  `cantidad_impuesto` int(11) NOT NULL,
  `nombre_impuesto` varchar(255) NOT NULL,
  `moneda` varchar(255) NOT NULL,
  `direccion` varchar(255) NOT NULL,
  `provincia` varchar(255) NOT NULL,
  `localidad` varchar(255) NOT NULL,
  `codigo_postal` varchar(255) NOT NULL,
  `logo` text NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `meta_gastos_fijos` decimal(12,2) DEFAULT 0.00,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empresas_cuit_unique` (`cuit`),
  UNIQUE KEY `empresas_correo_unique` (`correo`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `empresas`
--

LOCK TABLES `empresas` WRITE;
/*!40000 ALTER TABLE `empresas` DISABLE KEYS */;
INSERT INTO `empresas` VALUES (1,'Argentina','Morrone Ventas','Comercial','12345678','1138669097','admin@admin.com',21,'Iva','$','Juan Agustin Garcia 6 A','Buenos Aires','Villa Santa Rita','1416','logo-1766939244318-216285233.png','2025-03-05 07:37:54','2025-12-26 14:50:37',50000.00);
/*!40000 ALTER TABLE `empresas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `gastos`
--

DROP TABLE IF EXISTS `gastos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `gastos` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` text DEFAULT NULL,
  `fecha` datetime NOT NULL,
  `categoria_gasto_id` int(11) NOT NULL,
  `metodo_pago` enum('efectivo','tarjeta','mercadopago','banco') DEFAULT 'efectivo',
  `usuario_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `arqueo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `categoria_gasto_id` (`categoria_gasto_id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `empresa_id` (`empresa_id`),
  KEY `arqueo_id` (`arqueo_id`),
  CONSTRAINT `gastos_ibfk_1` FOREIGN KEY (`categoria_gasto_id`) REFERENCES `categorias_gastos` (`id`),
  CONSTRAINT `gastos_ibfk_2` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`),
  CONSTRAINT `gastos_ibfk_3` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `gastos_ibfk_4` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `gastos`
--

LOCK TABLES `gastos` WRITE;
/*!40000 ALTER TABLE `gastos` DISABLE KEYS */;
INSERT INTO `gastos` VALUES (1,1000.00,'Pago changa','2026-01-12 12:26:00',6,'efectivo',1,1,1,12,'2026-01-12 15:27:02','2026-01-12 15:27:02'),(2,5000.00,'Pago Alicia por limpieza','2026-01-13 15:16:00',5,'efectivo',1,1,1,16,'2026-01-13 18:17:10','2026-01-13 18:17:10'),(3,15000.00,'Pago Luz','2026-01-15 14:26:00',2,'mercadopago',1,1,1,35,'2026-01-15 17:26:48','2026-01-15 17:26:48');
/*!40000 ALTER TABLE `gastos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_patrimonio`
--

DROP TABLE IF EXISTS `historial_patrimonio`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_patrimonio` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `fecha` date DEFAULT curdate(),
  `valor_ars_total` decimal(18,2) NOT NULL,
  `cotizacion_usd` decimal(18,2) NOT NULL,
  `valor_usd_total` decimal(18,2) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `empresa_id` (`empresa_id`,`fecha`)
) ENGINE=InnoDB AUTO_INCREMENT=39 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_patrimonio`
--

LOCK TABLES `historial_patrimonio` WRITE;
/*!40000 ALTER TABLE `historial_patrimonio` DISABLE KEYS */;
INSERT INTO `historial_patrimonio` VALUES (1,1,'2026-01-17',1503500.00,1476.10,1018.56),(15,1,'2026-01-18',1777100.00,1476.10,1203.92),(31,1,'2026-01-19',1694450.00,1471.30,1151.67);
/*!40000 ALTER TABLE `historial_patrimonio` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `historial_precios`
--

DROP TABLE IF EXISTS `historial_precios`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `historial_precios` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) unsigned NOT NULL,
  `precio_anterior` decimal(10,2) DEFAULT NULL,
  `precio_nuevo` decimal(10,2) DEFAULT NULL,
  `costo_anterior` decimal(18,2) DEFAULT 0.00,
  `costo_nuevo` decimal(18,2) DEFAULT 0.00,
  `fecha_cambio` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `producto_id` (`producto_id`),
  CONSTRAINT `historial_precios_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=68 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `historial_precios`
--

LOCK TABLES `historial_precios` WRITE;
/*!40000 ALTER TABLE `historial_precios` DISABLE KEYS */;
INSERT INTO `historial_precios` VALUES (1,2,1210.00,1391.50,0.00,0.00,'2026-01-09 20:15:24'),(2,3,1320.00,1518.00,0.00,0.00,'2026-01-09 20:15:24'),(3,7,1210.00,1391.50,0.00,0.00,'2026-01-09 20:15:24'),(4,8,1210.00,1391.50,0.00,0.00,'2026-01-09 20:15:24'),(5,11,1320.00,1518.00,0.00,0.00,'2026-01-09 20:15:24'),(6,17,1650.00,1897.50,0.00,0.00,'2026-01-09 20:15:24'),(7,19,2970.00,3415.50,0.00,0.00,'2026-01-09 20:15:24'),(8,2,1391.50,1739.38,0.00,0.00,'2026-01-11 20:26:54'),(9,3,1518.00,1897.50,0.00,0.00,'2026-01-11 20:26:54'),(10,7,1391.50,1739.38,0.00,0.00,'2026-01-11 20:26:54'),(11,8,1391.50,1739.38,0.00,0.00,'2026-01-11 20:26:54'),(12,11,1518.00,1897.50,0.00,0.00,'2026-01-11 20:26:54'),(13,17,1897.50,2371.88,0.00,0.00,'2026-01-11 20:26:54'),(14,19,3415.50,4269.38,0.00,0.00,'2026-01-11 20:26:54'),(15,4,3100.00,3500.00,0.00,0.00,'2026-01-12 15:46:13'),(16,11,1897.50,1900.00,0.00,0.00,'2026-01-12 15:47:34'),(17,8,1739.38,1800.00,0.00,0.00,'2026-01-12 15:49:02'),(18,7,1739.38,1800.00,0.00,0.00,'2026-01-12 15:50:02'),(19,14,3450.00,3500.00,0.00,0.00,'2026-01-12 15:50:39'),(20,2,1739.38,1800.00,0.00,0.00,'2026-01-12 15:51:26'),(21,19,4269.38,4300.00,0.00,0.00,'2026-01-12 15:51:57'),(22,20,1350.00,1400.00,0.00,0.00,'2026-01-12 15:52:41'),(23,17,2371.88,2400.00,0.00,0.00,'2026-01-12 15:53:19'),(24,3,1897.50,1900.00,0.00,0.00,'2026-01-12 15:53:44'),(25,8,1800.00,1900.00,900.00,950.00,'2026-01-13 03:04:29'),(26,7,1800.00,2700.00,900.00,0.00,'2026-01-13 19:21:14'),(27,2,1800.00,2700.00,900.00,900.00,'2026-01-13 19:24:14'),(28,7,1800.00,2700.00,900.00,900.00,'2026-01-13 19:33:15'),(29,7,2700.00,1800.00,900.00,900.00,'2026-01-13 19:36:11'),(30,7,1800.00,2700.00,900.00,900.00,'2026-01-13 19:38:42'),(31,7,2700.00,1800.00,900.00,900.00,'2026-01-13 19:42:04'),(32,7,1800.00,2700.00,900.00,900.00,'2026-01-13 19:45:15'),(33,7,2700.00,1800.00,900.00,900.00,'2026-01-13 19:48:16'),(34,7,1800.00,2700.00,900.00,900.00,'2026-01-13 19:49:55'),(35,7,2700.00,1800.00,900.00,900.00,'2026-01-13 19:50:41'),(36,7,1800.00,2700.00,900.00,900.00,'2026-01-13 19:51:07'),(37,7,2700.00,1800.00,900.00,900.00,'2026-01-13 20:00:04'),(38,7,1800.00,2700.00,900.00,900.00,'2026-01-13 20:00:45'),(39,7,2700.00,1800.00,900.00,900.00,'2026-01-13 20:03:49'),(40,7,1800.00,2700.00,900.00,900.00,'2026-01-13 20:05:48'),(41,7,2700.00,1800.00,900.00,900.00,'2026-01-13 20:14:10'),(42,7,1800.00,2700.00,900.00,900.00,'2026-01-13 20:14:29'),(46,20,1400.00,4200.00,700.00,2100.00,'2026-01-14 22:03:31'),(47,20,4200.00,4600.00,2100.00,2300.00,'2026-01-15 22:59:24'),(48,2,2700.00,2160.00,900.00,1080.00,'2026-01-16 20:56:23'),(49,3,1900.00,2280.00,950.00,1140.00,'2026-01-16 20:56:23'),(50,7,2700.00,3240.00,900.00,1080.00,'2026-01-16 20:56:23'),(51,8,1900.00,2280.00,950.00,1140.00,'2026-01-16 20:56:23'),(52,17,2400.00,2880.00,1200.00,1440.00,'2026-01-16 20:56:23'),(53,19,4300.00,5160.00,2150.00,2580.00,'2026-01-16 20:56:23'),(54,8,2280.00,2400.00,1140.00,1200.00,'2026-01-16 21:00:23'),(55,7,3240.00,3300.00,1080.00,1100.00,'2026-01-16 21:00:42'),(56,2,2160.00,2200.00,1080.00,1100.00,'2026-01-16 21:01:04'),(57,19,5160.00,5200.00,2580.00,2600.00,'2026-01-16 21:01:21'),(58,17,2880.00,3000.00,1440.00,1500.00,'2026-01-16 21:01:54'),(59,3,2280.00,3000.00,1140.00,1500.00,'2026-01-16 21:02:08'),(60,4,3500.00,2000.00,1750.00,1000.00,'2026-01-17 01:06:59'),(61,4,2000.00,3500.00,1000.00,1750.00,'2026-01-17 01:11:07'),(62,42,2200.00,2000.00,1100.00,1000.00,'2026-01-18 00:31:27'),(63,43,2200.00,2000.00,1100.00,1000.00,'2026-01-18 00:31:27'),(64,44,3200.00,3000.00,1600.00,1500.00,'2026-01-18 02:54:41'),(65,17,3000.00,4500.00,1500.00,1500.00,'2026-01-18 18:07:50'),(66,17,4500.00,3000.00,1500.00,1500.00,'2026-01-18 18:10:22'),(67,44,3000.00,2800.00,1500.00,1400.00,'2026-01-19 16:29:47');
/*!40000 ALTER TABLE `historial_precios` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `logs`
--

DROP TABLE IF EXISTS `logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `accion` varchar(255) NOT NULL,
  `modulo` varchar(100) NOT NULL,
  `detalle` text DEFAULT NULL,
  `ip` varchar(45) DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `usuario_id` (`usuario_id`),
  KEY `empresa_id` (`empresa_id`),
  CONSTRAINT `logs_ibfk_1` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `logs_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=526 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `logs`
--

LOCK TABLES `logs` WRITE;
/*!40000 ALTER TABLE `logs` DISABLE KEYS */;
INSERT INTO `logs` VALUES (1,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $15000','::1',1,'2026-01-11 16:30:05'),(2,1,'CREAR','COMPRAS','Se registró una compra de $15500. Comprobante: FACTURA - 00000001. Proveedor ID: 4','::1',1,'2026-01-11 16:31:00'),(3,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $15000','::1',1,'2026-01-11 16:34:37'),(4,1,'CREAR','COMPRAS','Se registró una compra de $15500. Comprobante: FACTURA - 00000001. Proveedor ID: 4','::1',1,'2026-01-11 16:35:09'),(5,1,'CREAR','COMPRAS','Se registró una compra de $7500. Comprobante: FACTURA - 00000001. Proveedor ID: 12','::1',1,'2026-01-11 16:35:50'),(6,1,'CREAR','VENTAS','Se registró una venta por un total de $6600. Ticket N°: 1. Cliente ID: 1','::1',1,'2026-01-11 16:36:51'),(7,1,'CREAR','VENTAS','Se registró una venta por un total de $3630. Ticket N°: 2. Cliente ID: 1','::1',1,'2026-01-11 16:39:59'),(8,1,'CREAR','VENTAS','Se registró una venta por un total de $17000. Ticket N°: 3. Cliente ID: 1','::1',1,'2026-01-11 16:43:01'),(9,1,'CREAR','VENTAS','Se registró una venta por un total de $8600. Ticket N°: 4. Cliente ID: 3','::1',1,'2026-01-11 16:46:13'),(10,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $15000','::1',1,'2026-01-11 16:51:52'),(11,1,'CREAR','COMPRAS','Se registró una compra de $15500. Comprobante: FACTURA - 00000001. Proveedor ID: 4','::1',1,'2026-01-11 16:52:25'),(12,1,'CREAR','COMPRAS','Se registró una compra de $7500. Comprobante: FACTURA - 00000001. Proveedor ID: 12','::1',1,'2026-01-11 16:53:12'),(13,1,'CREAR','VENTAS','Se registró una venta por un total de $9700. Ticket N°: 1. Cliente ID: 1','::1',1,'2026-01-11 16:54:08'),(14,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 17:11:34'),(15,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-11 17:15:49'),(16,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:15:55'),(17,1,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-11 17:23:47'),(18,2,'LOGIN','AUTENTICACION','El usuario carla@gmail.com inició sesión','::1',1,'2026-01-11 17:23:59'),(19,2,'LOGOUT','AUTENTICACION','Sesión cerrada. Motivo: Cierre manual desde menú','::1',1,'2026-01-11 17:32:03'),(20,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:32:46'),(21,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:32:48'),(22,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:32:58'),(23,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:34:40'),(24,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:34:41'),(25,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:34:57'),(26,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:35:00'),(27,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:35:10'),(28,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:35:19'),(29,1,'LOGIN','AUTENTICACION','El usuario admin@admin.com inició sesión','::1',1,'2026-01-11 17:35:21'),(30,1,'LOGIN','AUTENTICACION','Inició sesión: admin@admin.com','::1',1,'2026-01-11 17:37:06'),(31,1,'LOGIN','AUTENTICACION','Inició sesión: admin@admin.com','::1',1,'2026-01-11 17:38:30'),(32,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-11 17:38:35'),(33,1,'LOGIN','AUTENTICACION','Inició sesión: admin@admin.com','::1',1,'2026-01-11 17:38:53'),(34,1,'CREAR','COMPRAS','Se registró una compra de $20000. Comprobante: FACTURA - 00000001. Proveedor ID: 18','::1',1,'2026-01-11 17:41:26'),(35,1,'CREAR','VENTAS','Se registró una venta por un total de $17000. Ticket N°: 2. Cliente ID: 1','::1',1,'2026-01-11 17:47:02'),(36,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-11 18:14:40'),(37,2,'LOGIN','AUTENTICACION','Inició sesión: carla@gmail.com','::1',1,'2026-01-11 18:15:00'),(38,2,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 18:15:57'),(39,2,'CREAR','VENTAS','Se registró una venta por un total de $7000. Ticket N°: 3. Cliente ID: 1','::1',1,'2026-01-11 18:18:06'),(40,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-11 18:22:20'),(41,1,'LOGIN','AUTENTICACION','Inició sesión: admin@admin.com','::1',1,'2026-01-11 18:22:28'),(42,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 18:32:58'),(43,1,'CREAR','VENTAS','Se registró una venta por un total de $6000. Ticket N°: 4. Cliente ID: 1','::1',1,'2026-01-11 18:38:13'),(44,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-11 18:52:09'),(45,2,'LOGIN','AUTENTICACION','Inició sesión: carla@gmail.com','::1',1,'2026-01-11 18:52:16'),(46,2,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 18:54:25'),(47,2,'CREAR','VENTAS','Se registró una venta por un total de $13700. Ticket N°: 5. Cliente ID: 3','::1',1,'2026-01-11 18:55:30'),(48,2,'CREAR','VENTAS','Se registró una venta por un total de $6500. Ticket N°: 6. Cliente ID: 1','::1',1,'2026-01-11 19:03:43'),(49,2,'CREAR','VENTAS','Se registró una venta por un total de $5000. Ticket N°: 7. Cliente ID: 1','::1',1,'2026-01-11 19:05:26'),(50,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-11 19:08:24'),(51,1,'LOGIN','AUTENTICACION','Inició sesión: admin@admin.com','::1',1,'2026-01-11 19:08:30'),(52,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 19:10:10'),(53,1,'CREAR','VENTAS','Se registró una venta por un total de $15200. Ticket N°: 8. Cliente ID: 1','::1',1,'2026-01-11 19:17:09'),(54,1,'CREAR','VENTAS','Se registró una venta por un total de $5000. Ticket N°: 9. Cliente ID: 1','::1',1,'2026-01-11 19:32:43'),(55,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 19:35:16'),(56,1,'CREAR','VENTAS','Se registró una venta por un total de $8810. Ticket N°: 10. Cliente ID: 1','::1',1,'2026-01-11 19:36:03'),(57,1,'CREAR','VENTAS','Se registró una venta por un total de $9150. Ticket N°: 11. Cliente ID: 1','::1',1,'2026-01-11 19:37:14'),(58,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 19:40:10'),(59,1,'CREAR','VENTAS','Se registró una venta por un total de $3000. Ticket N°: 12. Cliente ID: 1','::1',1,'2026-01-11 19:41:34'),(60,1,'CREAR','DEVOLUCIONES','Se registró la devolución N° 1 por un total de $3000. Motivo: No especificado','::1',1,'2026-01-11 19:43:09'),(61,1,'CREAR','VENTAS','Se registró una venta por un total de $10000. Ticket N°: 13. Cliente ID: 1','::1',1,'2026-01-11 19:44:29'),(62,1,'CREAR','VENTAS','Se registró una venta por un total de $7200. Ticket N°: 14. Cliente ID: 1','::1',1,'2026-01-11 19:46:08'),(63,1,'CREAR','VENTAS','Se registró una venta por un total de $5800. Ticket N°: 15. Cliente ID: 1','::1',1,'2026-01-11 19:51:54'),(64,1,'CREAR','VENTAS','Se registró una venta por un total de $5800. Ticket N°: 16. Cliente ID: 1','::1',1,'2026-01-11 19:56:55'),(65,1,'CREAR','INVENTARIO','Registró un ajuste de SALIDA de 1 unidades para el producto: Coca Cola 2L Env. Retornable. Motivo: Envase roto','::1',1,'2026-01-11 20:05:45'),(66,1,'CREAR','INVENTARIO','Registró un ajuste de ENTRADA de 1 unidades para el producto: Chipá tipo caseros Lucchetti 400g. Motivo: Sobrante en auditoria','::1',1,'2026-01-11 20:09:58'),(67,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 20:11:02'),(68,1,'CREAR','VENTAS','Se registró una venta por un total de $22910. Ticket N°: 17. Cliente ID: 1','::1',1,'2026-01-11 20:14:21'),(69,1,'EDITAR','PRODUCTOS','Ajuste masivo: +15% en costos. Se recalcularon precios de venta para 7 productos.','::1',1,'2026-01-11 20:15:24'),(70,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 20:18:43'),(71,1,'CREAR','VENTAS','Se registró una venta por un total de $8965.5. Ticket N°: 18. Cliente ID: 1','::1',1,'2026-01-11 20:22:08'),(72,1,'CREAR','VENTAS','Se registró una venta por un total de $11300. Ticket N°: 19. Cliente ID: 1','::1',1,'2026-01-11 20:24:03'),(73,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-11 20:26:15'),(74,1,'EDITAR','PRODUCTOS','Ajuste masivo: +25% en costos. Se recalcularon precios de venta para 7 productos.','::1',1,'2026-01-11 20:26:54'),(75,1,'EDITAR','PRODUCTOS','Se actualizó el producto Fideos Municiones Matarazzo 500g. Cambios: CATEGORIA_ID: \"4\" ➡️ \"3\" | FECHA_INGRESO: \"Thu Mar 06 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-06\"','::1',1,'2026-01-11 20:28:34'),(76,1,'CREAR','VENTAS','Se registró una venta por un total de $10000. Ticket N°: 20. Cliente ID: 1','::1',1,'2026-01-11 20:30:05'),(77,1,'CREAR','VENTAS','Se registró una venta por un total de $20200. Ticket N°: 21. Cliente ID: 5','::1',1,'2026-01-11 20:31:04'),(78,1,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-12 14:40:13'),(79,1,'PAGO','CLIENTES_CTA_CTE','Se registró un pago de $3000 en Caja 1 para el cliente ID: 3','::1',1,'2026-01-12 14:57:26'),(80,1,'CREAR','VENTAS','Se registró una venta por un total de $3100. Ticket N°: 22. Cliente ID: 1','::1',1,'2026-01-12 15:19:14'),(81,1,'CREAR','GASTOS','Se registró un gasto por $1000 (efectivo) en Caja 1. Descripción: Pago changa','::1',1,'2026-01-12 15:27:02'),(82,1,'PAGO','PROVEEDORES','Se registró un pago de $5.500 al proveedor ID: 4 vía efectivo desde Caja 1','::1',1,'2026-01-12 15:34:44'),(83,1,'EDITAR','PRODUCTOS','Se actualizó el producto Coca Cola 2L Env. Retornable. Cambios: PRECIO_COMPRA: \"1550.00\" ➡️ \"1750\" | PRECIO_VENTA: \"3100.00\" ➡️ \"3500.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-12 15:46:13'),(84,1,'EDITAR','PRODUCTOS','Se actualizó el producto Fideos Municiones Matarazzo 500g. Cambios: PRECIO_COMPRA: \"948.75\" ➡️ \"950\" | PRECIO_VENTA: \"1897.50\" ➡️ \"1900.00\" | FECHA_INGRESO: \"Thu Mar 06 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-06\"','::1',1,'2026-01-12 15:47:34'),(85,1,'EDITAR','PRODUCTOS','Se actualizó el producto Galletitas Sabor Cheddar Talitas Urquiza. Cambios: PRECIO_COMPRA: \"869.69\" ➡️ \"900\" | PRECIO_VENTA: \"1739.38\" ➡️ \"1800.00\" | FECHA_INGRESO: \"Wed Mar 05 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-05\"','::1',1,'2026-01-12 15:49:02'),(86,1,'EDITAR','PRODUCTOS','Se actualizó el producto Galletitas Saladas con Queso Talitas Urquiza. Cambios: PRECIO_COMPRA: \"869.69\" ➡️ \"900\" | PRECIO_VENTA: \"1739.38\" ➡️ \"1800.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-12 15:50:02'),(87,1,'EDITAR','PRODUCTOS','Se actualizó el producto Lactal - Pan de Mesa - 460g. Fargo. Cambios: PRECIO_COMPRA: \"1725.00\" ➡️ \"1750\" | PRECIO_VENTA: \"3450.00\" ➡️ \"3500.00\" | FECHA_INGRESO: \"Thu Mar 20 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-20\"','::1',1,'2026-01-12 15:50:39'),(88,1,'EDITAR','PRODUCTOS','Se actualizó el producto Merengadas Bagley 88g. Cambios: PRECIO_COMPRA: \"869.69\" ➡️ \"900\" | PRECIO_VENTA: \"1739.38\" ➡️ \"1800.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-12 15:51:26'),(89,1,'EDITAR','PRODUCTOS','Se actualizó el producto Merengadas Pack Bagley 264g. Cambios: PRECIO_COMPRA: \"2134.69\" ➡️ \"2150\" | PRECIO_VENTA: \"4269.38\" ➡️ \"4300.00\" | FECHA_INGRESO: \"Tue Apr 08 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-04-08\"','::1',1,'2026-01-12 15:51:57'),(90,1,'EDITAR','PRODUCTOS','Se actualizó el producto Jugo 100% Limon Minerva. Cambios: PRECIO_COMPRA: \"675.00\" ➡️ \"700.00\" | PRECIO_VENTA: \"1350.00\" ➡️ \"1400.00\" | FECHA_INGRESO: \"Tue Apr 08 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-04-08\"','::1',1,'2026-01-12 15:52:41'),(91,1,'EDITAR','PRODUCTOS','Se actualizó el producto Mini Alfaj. R.  Maicena - Cabo Blanco 145gr.. Cambios: PRECIO_COMPRA: \"1185.94\" ➡️ \"1200\" | PRECIO_VENTA: \"2371.88\" ➡️ \"2400.00\" | FECHA_INGRESO: \"Mon Mar 31 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-31\"','::1',1,'2026-01-12 15:53:19'),(92,1,'EDITAR','PRODUCTOS','Se actualizó el producto Tortitas sabor chocolate Arcor 152g. Cambios: PRECIO_COMPRA: \"948.75\" ➡️ \"950\" | PRECIO_VENTA: \"1897.50\" ➡️ \"1900.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-12 15:53:44'),(93,1,'CREAR','VENTAS','Se registró una venta por un total de $10500. Ticket N°: 23. Cliente ID: 1','::1',1,'2026-01-12 15:55:32'),(94,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 15:56:22'),(95,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2','::1',1,'2026-01-12 16:12:02'),(96,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 16:12:18'),(97,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 2','::1',1,'2026-01-12 16:12:32'),(98,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 16:12:40'),(99,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-12 16:13:37'),(100,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 16:14:38'),(101,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2','::1',1,'2026-01-12 16:18:22'),(102,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 16:19:12'),(103,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-12 16:19:29'),(104,1,'CREAR','VENTAS','Se registró una venta por un total de $13000. Ticket N°: 24. Cliente ID: 1','::1',1,'2026-01-12 16:23:23'),(105,1,'CREAR','VENTAS','Se registró una venta por un total de $12000. Ticket N°: 25. Cliente ID: 1','::1',1,'2026-01-12 16:25:43'),(106,1,'EDITAR','PRODUCTOS','Se actualizó el producto Caro Cuore Desodorante 123 ml. Cambios: STOCK: \"14\" ➡️ \"5\" | FECHA_INGRESO: \"Sun Dec 28 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-12-28\"','::1',1,'2026-01-12 17:16:35'),(107,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 18:04:39'),(108,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2','::1',1,'2026-01-12 18:05:49'),(109,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 18:09:04'),(110,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 2','::1',1,'2026-01-12 18:09:12'),(111,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 18:09:50'),(112,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-12 18:10:41'),(113,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 18:23:33'),(114,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2','::1',1,'2026-01-12 18:24:48'),(115,2,'CREAR','ARQUEO_CAJA','Apertura de caja realizada. Monto inicial: $10000','::1',1,'2026-01-12 18:25:52'),(116,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-12 18:51:34'),(117,2,'EDITAR','PRODUCTOS','Se actualizó el producto Caro Cuore Desodorante 123 ml. Cambios: STOCK: \"5\" ➡️ \"15\" | FECHA_INGRESO: \"Sun Dec 28 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-12-28\"','::1',1,'2026-01-12 19:05:00'),(118,2,'CREAR','VENTAS','Se registró una venta por un total de $7000. Ticket N°: 26. Cliente ID: 1','::1',1,'2026-01-12 19:09:00'),(119,2,'PAGO','CLIENTES_CTA_CTE','Se registró un pago de $2200 en Caja 2 para el cliente ID: 5','::1',1,'2026-01-12 19:13:43'),(120,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-12 19:17:57'),(121,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-12 19:18:55'),(122,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-12 20:01:33'),(123,1,'CREAR','VENTAS','Se registró una venta por un total de $6500. Ticket N°: 27. Cliente ID: 1','::1',1,'2026-01-12 20:24:15'),(124,1,'CREAR','VENTAS','Se registró una venta por un total de $7100. Ticket N°: 28. Cliente ID: 3','::1',1,'2026-01-12 20:27:20'),(125,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 29. Cliente ID: 5','::1',1,'2026-01-13 00:04:37'),(126,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 30. Cliente ID: 5','::1',1,'2026-01-13 00:06:57'),(127,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 31. Cliente ID: 1','::1',1,'2026-01-13 01:38:46'),(128,1,'EDITAR','PRODUCTOS','Editó Galletitas Sabor Cheddar Talitas Urquiza. Cambios: PRECIO_COMPRA: \"900.00\" ➡️ \"950\" | PRECIO_VENTA: \"1800.00\" ➡️ \"1900.00\" | FECHA_INGRESO: \"Wed Mar 05 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-05\"','::1',1,'2026-01-13 03:04:29'),(129,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-13 15:19:04'),(130,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 32. Cliente ID: 1','::1',1,'2026-01-13 18:12:23'),(131,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 33. Cliente ID: 1','::1',1,'2026-01-13 18:15:32'),(132,1,'CREAR','GASTOS','Se registró un gasto por $5000 (efectivo) en Caja 1. Descripción: Pago Alicia por limpieza','::1',1,'2026-01-13 18:17:10'),(133,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Almacen. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:00:39'),(134,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Almacen. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:02:27'),(135,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Almacen. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:09:16'),(136,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Almacen. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:13:00'),(137,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Almacen. Cambios: MARGEN_OBJETIVO: \"100.00\" ➡️ \"300\"','::1',1,'2026-01-13 19:13:42'),(138,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Almacen. Cambios: MARGEN_OBJETIVO: \"300.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:17:25'),(139,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Bebidas alcohólicas. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:17:58'),(140,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Bebidas sin alcohol. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:18:06'),(141,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Cuidado Personal. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:18:15'),(142,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Fiambrería. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:18:24'),(143,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Galletitas. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:18:35'),(144,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Galletitas. Cambios: MARGEN_OBJETIVO: \"100.00\" ➡️ \"200\"','::1',1,'2026-01-13 19:18:53'),(145,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-13 19:19:03'),(146,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Panaderia. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:19:18'),(147,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Pastas. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:19:26'),(148,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Perfumeria. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:19:34'),(149,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Productos enlatados. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:19:42'),(150,1,'EDITAR','CATEGORIAS','Se actualizó la categoría: Productos lácteos. Cambios: MARGEN_OBJETIVO: \"0.00\" ➡️ \"100\"','::1',1,'2026-01-13 19:19:52'),(151,1,'EDITAR','PRODUCTOS','Actualización de producto ID 2. Cambios: PRECIO_VENTA: \"1800.00\" ➡️ \"2700.00\"','::1',1,'2026-01-13 19:24:14'),(152,1,'EDITAR','PRODUCTOS','Guardian: Actualización de margen/precio para Galletitas Saladas con Queso Talitas Urquiza','::1',1,'2026-01-13 19:33:15'),(153,1,'EDITAR','PRODUCTOS','Guardian: Actualización de margen/precio para Galletitas Saladas con Queso Talitas Urquiza','::1',1,'2026-01-13 19:36:11'),(154,1,'EDITAR','PRODUCTOS','Guardian: Sincronización de Margen (200%) para Galletitas Saladas con Queso Talitas Urquiza. Nuevo precio: 2700','::1',1,'2026-01-13 19:38:42'),(155,1,'EDITAR','PRODUCTOS','Guardian: Sincronización de Margen (200%) para Galletitas Saladas con Queso Talitas Urquiza. Nuevo precio: 2700','::1',1,'2026-01-13 19:40:13'),(156,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_VENTA: \"2700.00\" ➡️ \"1800.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-13 19:42:04'),(157,1,'EDITAR','PRODUCTOS','Guardian: Corrigió margen de Galletitas Saladas con Queso Talitas Urquiza a 200% ($2700)','::1',1,'2026-01-13 19:45:15'),(158,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_VENTA: \"2700.00\" ➡️ \"1800.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-13 19:48:16'),(159,1,'EDITAR','PRODUCTOS','Guardian BI: Actualizó Galletitas Saladas con Queso Talitas Urquiza. Margen: 200% | Nueva Venta: $2700.00','::1',1,'2026-01-13 19:49:55'),(160,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_VENTA: \"2700.00\" ➡️ \"1800.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-13 19:50:41'),(161,1,'EDITAR','PRODUCTOS','Guardian BI: Actualizó Galletitas Saladas con Queso Talitas Urquiza. Margen: 200% | Nueva Venta: $2700.00','::1',1,'2026-01-13 19:51:07'),(162,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_VENTA: \"2700.00\" ➡️ \"1800.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-13 20:00:04'),(163,1,'EDITAR','PRODUCTOS','Guardian BI: Actualizó Galletitas Saladas con Queso Talitas Urquiza. Margen: 200% | Nueva Venta: $2700.00','::1',1,'2026-01-13 20:00:45'),(164,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_VENTA: \"2700.00\" ➡️ \"1800.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-13 20:03:49'),(165,1,'EDITAR','PRODUCTOS','Guardian BI: Actualizó Galletitas Saladas con Queso Talitas Urquiza. Margen: 200% | Nueva Venta: $2700.00','::1',1,'2026-01-13 20:05:48'),(166,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_VENTA: \"2700.00\" ➡️ \"1800.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-13 20:14:10'),(167,1,'EDITAR','PRODUCTOS','Guardian BI: Actualizó Galletitas Saladas con Queso Talitas Urquiza. Margen: 200% | Nueva Venta: $2700.00','::1',1,'2026-01-13 20:14:29'),(168,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 34. Cliente ID: 1','::1',1,'2026-01-13 21:10:16'),(169,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 35. Cliente ID: 1','::1',1,'2026-01-13 21:11:40'),(170,1,'RETIRO','ARQUEOS','Retiro parcial de $10000 en Caja 1. Motivo: Retiro por seguridad','::1',1,'2026-01-13 21:28:40'),(171,1,'CREAR','ARQUEO_MOVIMIENTO','Movimiento manual de Ingreso: $10000. Motivo: Para pagos servicios','::1',1,'2026-01-13 21:53:12'),(172,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-13 22:12:27'),(173,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 36. Cliente ID: 1','::1',1,'2026-01-13 22:13:33'),(174,1,'RETIRO','ARQUEOS','Retiro parcial de $5000 en Caja 1. Motivo: Retiro dueño','::1',1,'2026-01-13 22:14:46'),(175,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-13 22:55:26'),(176,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Diego Martin Trinidad','::1',1,'2026-01-13 22:56:26'),(177,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 37. Cliente ID: 1','::1',1,'2026-01-13 23:40:24'),(178,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 13:40:19'),(179,1,'CERRAR','ARQUEOS','Cierre de caja ID 17. Diferencia: -15000.00','::1',1,'2026-01-14 14:07:34'),(180,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000.00','::1',1,'2026-01-14 14:21:15'),(181,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 38. Cliente ID: 1','::1',1,'2026-01-14 14:22:10'),(182,1,'RETIRO','ARQUEOS','Retiro parcial de $5000 en Caja 1. Motivo: Retiro dueño','::1',1,'2026-01-14 14:22:57'),(183,1,'CERRAR','ARQUEOS','Cierre de caja ID 18. Diferencia: -10000.00','::1',1,'2026-01-14 14:23:56'),(184,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000.00','::1',1,'2026-01-14 14:35:32'),(185,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 39. Cliente ID: 1','::1',1,'2026-01-14 14:37:46'),(186,1,'RETIRO','ARQUEOS','Retiro parcial de $5000 en Caja 1. Motivo: Retiro dueño','::1',1,'2026-01-14 14:47:45'),(187,1,'CERRAR','ARQUEOS','Cierre de caja ID 19. Dif: -10000.00','::1',1,'2026-01-14 14:48:17'),(188,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000.00','::1',1,'2026-01-14 14:52:29'),(189,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 40. Cliente ID: 1','::1',1,'2026-01-14 14:53:34'),(190,1,'RETIRO','ARQUEOS','Retiro parcial de $5000 en Caja 1. Motivo: Retiro dueño','::1',1,'2026-01-14 14:54:04'),(191,1,'CERRAR','ARQUEOS','Cierre de caja ID 20. Diferencia: 0.00','::1',1,'2026-01-14 14:54:23'),(192,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000.00','::1',1,'2026-01-14 14:55:50'),(193,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 41. Cliente ID: 1','::1',1,'2026-01-14 15:12:16'),(194,1,'CERRAR','ARQUEOS','Cierre de caja ID 21. Diferencia: 0.00','::1',1,'2026-01-14 16:04:56'),(195,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 16:07:42'),(196,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 42. Cliente ID: 1','::1',1,'2026-01-14 16:08:17'),(197,1,'CERRAR','ARQUEOS','Cierre de caja ID 22. Diferencia: 0.00','::1',1,'2026-01-14 16:09:00'),(198,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 16:18:22'),(199,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 43. Cliente ID: 1','::1',1,'2026-01-14 16:19:26'),(200,1,'CERRAR','ARQUEOS','Cierre de caja ID 23. Diferencia: 0.00','::1',1,'2026-01-14 16:20:29'),(201,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 16:24:18'),(202,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 44. Cliente ID: 1','::1',1,'2026-01-14 16:25:10'),(203,1,'RETIRO','ARQUEOS','Retiro parcial de $5000 en Caja 1. Motivo: Retiro de seguridad','::1',1,'2026-01-14 16:25:35'),(204,1,'CERRAR','ARQUEOS','Cierre de caja ID 24. Diferencia: 0.00','::1',1,'2026-01-14 16:26:20'),(205,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 16:45:09'),(206,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 45. Cliente ID: 1','::1',1,'2026-01-14 16:45:47'),(207,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 16:55:33'),(208,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 46. Cliente ID: 1','::1',1,'2026-01-14 16:56:25'),(209,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 17:05:31'),(210,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 47. Cliente ID: 1','::1',1,'2026-01-14 17:06:01'),(211,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 17:10:51'),(212,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 48. Cliente ID: 1','::1',1,'2026-01-14 17:12:07'),(213,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 17:17:13'),(214,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 49. Cliente ID: 1','::1',1,'2026-01-14 17:17:36'),(215,1,'CERRAR','ARQUEOS','Cierre de caja ID 29. Diferencia: 0.00','::1',1,'2026-01-14 17:18:00'),(216,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 17:29:30'),(217,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 52. Cliente ID: 1','::1',1,'2026-01-14 17:39:40'),(218,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:45:57'),(219,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:49:24'),(220,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:51:05'),(221,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:51:45'),(222,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:54:10'),(223,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:55:50'),(224,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 17:58:20'),(225,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 18:00:21'),(226,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 18:03:13'),(227,1,'WHATSAPP','CLIENTES','Mensaje de recaptura enviado a Natalia Oduber','::1',1,'2026-01-14 18:06:26'),(228,1,'CERRAR','ARQUEOS','Cierre de caja ID 30. Diferencia: 0.00','::1',1,'2026-01-14 18:08:23'),(229,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 18:12:30'),(230,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 53. Cliente ID: 1','::1',1,'2026-01-14 18:13:09'),(231,1,'CERRAR','ARQUEOS','Cierre de caja ID 31. Diferencia: 0.00','::1',1,'2026-01-14 18:13:33'),(232,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 18:22:21'),(233,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 54. Cliente ID: 1','::1',1,'2026-01-14 18:23:04'),(234,1,'CERRAR','ARQUEOS','Cierre ID 32. Dif: 0.00','::1',1,'2026-01-14 18:23:22'),(235,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 18:29:12'),(236,1,'CREAR','VENTAS','Venta notificada. Ticket N°: 55. Cliente ID: 1','::1',1,'2026-01-14 18:29:32'),(237,1,'CERRAR','ARQUEOS','Cierre ID 33. Venta declarada: 10000. Dif: 0','::1',1,'2026-01-14 18:29:50'),(238,1,'EDITAR','CONFIGURACION_EMPRESA','Se actualizaron los datos de la empresa: Morrone Ventas','::1',1,'2026-01-14 18:55:51'),(239,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-14 19:13:35'),(240,1,'LOGOUT','AUTENTICACION','Sesión expirada','::1',1,'2026-01-14 19:19:04'),(241,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-14 19:20:56'),(242,1,'CREAR','VENTAS','Venta registrada. Ticket N°: 57. Cliente ID: 5','::1',1,'2026-01-14 19:40:03'),(243,1,'CREAR','VENTAS','Venta registrada. Ticket N°: 58. Cliente ID: 3','::1',1,'2026-01-14 19:45:53'),(244,1,'CREAR','VENTAS','Venta registrada. Ticket N°: 59. Cliente ID: 3','::1',1,'2026-01-14 19:49:39'),(245,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 60. Cliente ID: 3','::1',1,'2026-01-14 19:53:16'),(246,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 61. Cliente ID: 5','::1',1,'2026-01-14 19:59:49'),(247,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 62. Cliente ID: 5','::1',1,'2026-01-14 20:52:31'),(248,1,'CREAR','PROVEEDORES','Se registró al proveedor: Minerva Srl. Marca: Minerva. Contacto: Pedro Parada','::1',1,'2026-01-14 21:53:19'),(249,1,'CREAR','COMPRAS','Compra registrada $2100. Recalculo de precios ejecutado.','::1',1,'2026-01-14 22:03:31'),(250,1,'CERRAR','ARQUEOS','Cierre ID 34. Venta declarada: 21500. Dif: 0','::1',1,'2026-01-14 22:23:34'),(251,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-15 13:41:51'),(252,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 63. Cliente ID: 5','::1',1,'2026-01-15 14:09:23'),(253,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 64. Cliente ID: 1','::1',1,'2026-01-15 14:50:39'),(254,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 65. Cliente ID: 1','::1',1,'2026-01-15 15:03:22'),(255,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 66. Cliente ID: 1','::1',1,'2026-01-15 15:05:56'),(256,1,'CREAR','COMPRAS','Compra registrada $2900. Recalculo de precios ejecutado.','::1',1,'2026-01-15 15:12:50'),(257,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 67. Cliente ID: 1','::1',1,'2026-01-15 15:36:46'),(258,1,'CREAR','COMPRAS','Compra registrada $2900. Recalculo de precios ejecutado.','::1',1,'2026-01-15 15:44:20'),(259,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 68. Cliente ID: 1','::1',1,'2026-01-15 15:46:02'),(260,1,'CREAR','COMPRAS','Compra registrada $2900. Recalculo de precios ejecutado.','::1',1,'2026-01-15 15:51:44'),(261,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 69. Cliente ID: 1','::1',1,'2026-01-15 15:52:36'),(262,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 70. Cliente ID: 1','::1',1,'2026-01-15 15:55:51'),(263,1,'EDITAR','CONFIGURACION_EMPRESA','Se actualizaron los datos de la empresa: Morrone Ventas','::1',1,'2026-01-15 17:25:45'),(264,1,'CREAR','GASTOS','Se registró un gasto por $15000 (mercadopago) en Caja 1. Descripción: Pago Luz','::1',1,'2026-01-15 17:26:48'),(265,1,'LOGOUT','AUTENTICACION','Sesión expirada','::1',1,'2026-01-15 19:21:00'),(266,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-15 19:21:08'),(267,1,'WHATSAPP','CLIENTES','Se envió reclamo de deuda automático a Diego Martin Trinidad. Monto: $18000.00','::1',1,'2026-01-15 19:43:55'),(268,1,'CREAR','CLIENTES','Nuevo cliente: Alba Alisa Rodriguez. CUIL: 96441182. Contacto: 1138669097','::1',1,'2026-01-15 20:02:56'),(269,1,'EDITAR','CLIENTES','Editó cliente: Natalia Oduber. Cambios detectados: FECHA_NACIMIENTO: \"null\" ➡️ \"2024-01-15\"','::1',1,'2026-01-15 20:05:49'),(270,1,'CREAR','CLIENTES','Nuevo cliente: Maximiliano Hoeffler. CUIL: 24665874. Contacto: 1138669097','::1',1,'2026-01-15 20:11:23'),(271,1,'WHATSAPP','CLIENTES','Saludo de CUMPLEAÑOS enviado a Natalia Oduber','::1',1,'2026-01-15 20:19:41'),(272,1,'WHATSAPP','CLIENTES','Saludo de ANIVERSARIO enviado a Diego Martin Trinidad','::1',1,'2026-01-15 20:29:04'),(273,1,'WHATSAPP','CLIENTES','Saludo de ANIVERSARIO enviado a Diego Martin Trinidad','::1',1,'2026-01-15 20:35:52'),(274,1,'ELIMINAR','CLIENTES','Se eliminó al cliente: Maximiliano Hoeffler','::1',1,'2026-01-15 20:47:50'),(275,1,'CREAR','CLIENTES','Nuevo cliente: Maximiliano Hoeffler. CUIL: 25669887. Contacto: 1138669097','::1',1,'2026-01-15 20:53:37'),(276,1,'ELIMINAR','CLIENTES','Se eliminó al cliente: Maximiliano Hoeffler','::1',1,'2026-01-15 20:53:44'),(277,1,'EDITAR','CLIENTES','Editó cliente: Diego Martin Trinidad. Cambios detectados: FECHA_NACIMIENTO: \"null\" ➡️ \"2025-01-15\"','::1',1,'2026-01-15 21:10:22'),(278,1,'CREAR','COMPRAS','Compra registrada $23000. Recalculo de precios ejecutado.','::1',1,'2026-01-15 22:59:24'),(279,1,'CERRAR','ARQUEOS','Cierre ID 35. Venta declarada: 14000. Dif: 0','::1',1,'2026-01-16 00:32:10'),(280,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-16 13:32:13'),(281,1,'CREAR','COMPRAS','Compra registrada $23000. Recalculo de precios ejecutado.','::1',1,'2026-01-16 13:34:37'),(282,1,'CREAR','COMPRAS','Compra registrada $12000. Recalculo de precios ejecutado.','::1',1,'2026-01-16 13:36:47'),(283,1,'EDITAR','PROVEEDORES','Se actualizaron los datos del proveedor: Fiambres Calchaqui S.R.L.. Cambios: CELULAR: \"1145887895\" ➡️ \"1138669097\"','::1',1,'2026-01-16 15:32:12'),(284,1,'EDITAR','PROVEEDORES','Se actualizaron los datos del proveedor: Fiambres Calchaqui S.R.L.. Cambios: TELEFONO: \"1144189384\" ➡️ \"1138669097\"','::1',1,'2026-01-16 15:36:40'),(285,1,'WHATSAPP','COMPRAS','Pedido automático enviado a Fiambres Calchaqui S.R.L.','::1',1,'2026-01-16 15:37:25'),(286,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 71. Cliente ID: 1','::1',1,'2026-01-16 18:02:41'),(287,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 72. Cliente ID: 1','::1',1,'2026-01-16 18:07:16'),(288,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 73. Cliente ID: 1','::1',1,'2026-01-16 18:25:44'),(289,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 74. Cliente ID: 1','::1',1,'2026-01-16 18:31:58'),(290,1,'LOGOUT','AUTENTICACION','Sesión expirada','::1',1,'2026-01-16 19:21:12'),(291,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1','::1',1,'2026-01-16 19:21:22'),(292,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 75. Cliente ID: 5','::1',1,'2026-01-16 19:47:29'),(293,1,'EDITAR','PRODUCTOS','Actualización de producto ID 8. Cambios: PRECIO_COMPRA: \"1140.00\" ➡️ \"1200\" | PRECIO_VENTA: \"2280.00\" ➡️ \"2400.00\" | FECHA_INGRESO: \"Wed Mar 05 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-05\"','::1',1,'2026-01-16 21:00:23'),(294,1,'EDITAR','PRODUCTOS','Actualización de producto ID 7. Cambios: PRECIO_COMPRA: \"1080.00\" ➡️ \"1100\" | PRECIO_VENTA: \"3240.00\" ➡️ \"3300.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-16 21:00:42'),(295,1,'EDITAR','PRODUCTOS','Actualización de producto ID 2. Cambios: PRECIO_COMPRA: \"1080.00\" ➡️ \"1100\" | PRECIO_VENTA: \"2160.00\" ➡️ \"2200.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-16 21:01:04'),(296,1,'EDITAR','PRODUCTOS','Actualización de producto ID 19. Cambios: PRECIO_COMPRA: \"2580.00\" ➡️ \"2600\" | PRECIO_VENTA: \"5160.00\" ➡️ \"5200.00\" | FECHA_INGRESO: \"Tue Apr 08 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-04-08\"','::1',1,'2026-01-16 21:01:21'),(297,1,'EDITAR','PRODUCTOS','Actualización de producto ID 17. Cambios: PRECIO_COMPRA: \"1440.00\" ➡️ \"1500\" | PRECIO_VENTA: \"2880.00\" ➡️ \"3000.00\" | FECHA_INGRESO: \"Mon Mar 31 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-31\"','::1',1,'2026-01-16 21:01:54'),(298,1,'EDITAR','PRODUCTOS','Actualización de producto ID 3. Cambios: PRECIO_COMPRA: \"1140.00\" ➡️ \"1500\" | PRECIO_VENTA: \"2280.00\" ➡️ \"3000.00\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-16 21:02:08'),(299,1,'CREAR','COMPRAS','Compra registrada $15000. Recalculo de precios ejecutado.','::1',1,'2026-01-16 22:42:47'),(300,1,'CREAR','COMPRAS','Compra registrada $15000. Recalculo de precios ejecutado.','::1',1,'2026-01-16 22:45:05'),(301,1,'CREAR','COMPRAS','Compra registrada $35000. Recalculo de precios ejecutado.','::1',1,'2026-01-16 23:07:51'),(302,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 76. Cliente ID: 6','::1',1,'2026-01-16 23:09:36'),(303,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 77. Cliente ID: 4','::1',1,'2026-01-16 23:10:47'),(304,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 78. Cliente ID: 2','::1',1,'2026-01-16 23:21:22'),(305,1,'EDITAR','PRODUCTOS','Actualización de producto ID 29. Cambios: STOCK: \"14\" ➡️ \"5\" | FECHA_INGRESO: \"Sun Dec 28 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-12-28\"','::1',1,'2026-01-16 23:22:42'),(306,1,'EDITAR','PRODUCTOS','Actualización de producto ID 30. Cambios: STOCK: \"15\" ➡️ \"5\" | FECHA_INGRESO: \"Sun Dec 28 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-12-28\"','::1',1,'2026-01-16 23:23:08'),(307,1,'EDITAR','PRODUCTOS','Actualización de producto ID 5. Cambios: STOCK: \"8\" ➡️ \"3\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-16 23:23:37'),(308,1,'EDITAR','PRODUCTOS','Actualización de producto ID 5. Cambios: STOCK: \"3\" ➡️ \"8\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-16 23:52:16'),(309,1,'EDITAR','PRODUCTOS','Actualización de producto ID 29. Cambios: STOCK: \"5\" ➡️ \"15\" | FECHA_INGRESO: \"Sun Dec 28 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-12-28\"','::1',1,'2026-01-16 23:52:42'),(310,1,'EDITAR','PRODUCTOS','Actualización de producto ID 30. Cambios: STOCK: \"5\" ➡️ \"15\" | FECHA_INGRESO: \"Sun Dec 28 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-12-28\"','::1',1,'2026-01-16 23:53:06'),(311,1,'CREAR','PROVEEDORES','Se registró al proveedor: Proveedor Bebidas General. Marca: Coca Cola. Contacto: Alicia Ferraro','::1',1,'2026-01-17 01:04:37'),(312,1,'CREAR','COMPRAS','Compra registrada $10000. Recalculo de precios ejecutado.','::1',1,'2026-01-17 01:06:59'),(313,1,'CREAR','COMPRAS','Compra registrada $17500. Recalculo de precios ejecutado.','::1',1,'2026-01-17 01:11:07'),(314,1,'EDITAR','PRODUCTOS','Actualización de producto ID 4. Cambios: STOCK: \"69\" ➡️ \"0\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-17 01:23:47'),(315,1,'EDITAR','PRODUCTOS','Actualización de producto ID 4. Cambios: STOCK: \"0\" ➡️ \"69\" | FECHA_INGRESO: \"Mon Mar 03 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-03\"','::1',1,'2026-01-17 01:24:43'),(316,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 79. Cliente ID: 1','::1',1,'2026-01-17 01:25:44'),(317,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 80. Cliente ID: 1','::1',1,'2026-01-17 01:44:49'),(318,1,'CERRAR','ARQUEOS','Cierre ID 36. Venta declarada: 21900. Dif: -20100','::1',1,'2026-01-17 01:59:34'),(319,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-17 02:03:59'),(320,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 81. Cliente ID: 1','::1',1,'2026-01-17 02:04:28'),(321,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 82. Cliente ID: 1','::1',1,'2026-01-17 02:05:49'),(322,1,'CERRAR','ARQUEOS','Cierre ID 37. Venta declarada: 10000. Dif: 0','::1',1,'2026-01-17 02:10:58'),(323,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-17 02:13:29'),(324,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 83. Cliente ID: 1','::1',1,'2026-01-17 02:16:48'),(325,1,'CREAR','VENTAS','Venta registrada con Billetera. Ticket: 84. Cliente ID: 1','::1',1,'2026-01-17 02:17:32'),(326,1,'CERRAR','ARQUEOS','Cierre ID 38. Venta declarada: 10000. Dif: 0','::1',1,'2026-01-17 02:18:05'),(327,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 05:45:24'),(328,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 05:46:49'),(329,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 05:47:08'),(330,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 05:47:21'),(331,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 05:47:26'),(332,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 05:48:49'),(333,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 05:48:54'),(334,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 06:14:04'),(335,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-17 06:34:27'),(336,1,'CREAR','VENTAS','Venta registrada. Ticket: 85. Tiempo: 25s','::1',1,'2026-01-17 06:35:02'),(337,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 13:51:18'),(338,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 13:52:00'),(339,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 13:54:08'),(340,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 13:55:11'),(341,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 13:55:37'),(342,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 13:56:55'),(343,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 13:57:19'),(344,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 13:57:26'),(345,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 13:57:39'),(346,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::1',1,'2026-01-17 13:59:23'),(347,1,'CERRAR','ARQUEOS','Cierre ID 39. Venta declarada: 10000. Dif: 0','::1',1,'2026-01-17 14:00:09'),(348,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 14:00:24'),(349,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 14:01:11'),(350,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 14:01:33'),(351,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 14:01:44'),(352,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 14:08:45'),(353,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 14:08:52'),(354,1,'EDITAR','SEGURIDAD_ROLES','Se actualizaron permisos del rol: Cajero/a. ANTERIORES: [ver_empresa, ver_productos, ver_clientes, ver_ventas, ver_arqueos, ver_devoluciones, ver_ajustes, ver_movimientos, ver_gastos] ➡️ NUEVOS: [ver_ajustes, ver_arqueos, ver_categorias, ver_clientes, ver_combos, ver_compras, ver_configuracion, ver_devoluciones, ver_empresa, ver_gastos, ver_logs, ver_movimientos, ver_permisos, ver_productos, ver_proveedores, ver_roles, ver_unidades, ver_usuarios, ver_ventas]','::1',1,'2026-01-17 14:09:17'),(355,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 14:09:24'),(356,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 14:09:31'),(357,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-17 14:10:02'),(358,2,'CREAR','VENTAS','Venta registrada. Ticket: 86. Tiempo: 163s','::1',1,'2026-01-17 15:07:56'),(359,2,'CREAR','VENTAS','Venta registrada. Ticket: 87. Tiempo: 83s','::1',1,'2026-01-17 15:32:19'),(360,2,'CREAR','VENTAS','Venta registrada. Ticket: 88. Tiempo: 37s','::1',1,'2026-01-17 16:34:40'),(361,2,'CREAR','PRODUCTOS','Se registró el producto: Leche Larga Vida Clasica La Serenisima (Código: 7790742363008) con imagen en Cloudinary.','::1',1,'2026-01-17 16:50:56'),(362,2,'CREAR','PRODUCTOS','Se registró el producto: Lecha Larga Vida Liviana La Serenisima (Código: 7790742363107) con imagen en Cloudinary.','::1',1,'2026-01-17 16:55:10'),(363,2,'EDITAR','PRODUCTOS','Actualización de producto ID 34. Cambios: NOMBRE_CORTO: \"LECHE-LARGA-V-LASERE\" ➡️ \"LECHE-LARGA-VC-LASERE\" | FECHA_INGRESO: \"Sat Jan 17 2026 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2026-01-17\"','::1',1,'2026-01-17 17:05:48'),(364,2,'CREAR','COMPRAS','Compra registrada $105000. Recalculo de precios ejecutado.','::1',1,'2026-01-17 17:14:41'),(365,2,'CREAR','VENTAS','Venta registrada. Ticket: 89. Tiempo: 72s','::1',1,'2026-01-17 17:16:40'),(366,2,'CERRAR','ARQUEOS','Cierre ID 40. Venta declarada: 18800. Dif: 6000','::1',1,'2026-01-17 17:39:20'),(367,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 17:41:14'),(368,1,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 17:41:23'),(369,1,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-17 17:46:57'),(370,1,'CREAR','VENTAS','Venta registrada. Ticket: 90. Tiempo: 35s','::1',1,'2026-01-17 17:47:57'),(371,1,'CREAR','VENTAS','Venta registrada. Ticket: 91. Tiempo: 19s','::1',1,'2026-01-17 17:48:39'),(372,1,'CREAR','VENTAS','Venta registrada. Ticket: 92. Tiempo: 22s','::1',1,'2026-01-17 17:49:18'),(373,1,'CERRAR','ARQUEOS','Cierre ID 41. Venta declarada: 10800. Dif: 0','::1',1,'2026-01-17 17:50:19'),(374,1,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-17 17:51:30'),(375,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-17 17:51:45'),(376,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-17 17:52:03'),(377,2,'CREAR','VENTAS','Venta registrada. Ticket: 93. Tiempo: 18s','::1',1,'2026-01-17 17:59:13'),(378,2,'CREAR','VENTAS','Venta registrada. Ticket: 94. Tiempo: 36s','::1',1,'2026-01-17 18:00:02'),(379,2,'CREAR','VENTAS','Venta registrada. Ticket: 95. Tiempo: 24s','::1',1,'2026-01-17 18:47:17'),(380,2,'CREAR','VENTAS','Venta registrada. Ticket: 96. Tiempo: 13s','::1',1,'2026-01-17 18:48:34'),(381,2,'CREAR','VENTAS','Venta registrada. Ticket: 97. Tiempo: 26s','::1',1,'2026-01-17 18:49:37'),(382,2,'CREAR','COMPRAS','Compra registrada $162000. Recalculo de precios ejecutado.','::1',1,'2026-01-17 19:43:19'),(383,2,'CREAR','VENTAS','Venta registrada. Ticket: 98. Tiempo: 29s','::1',1,'2026-01-17 20:37:41'),(384,2,'CREAR','VENTAS','Venta registrada. Ticket: 99. Tiempo: 53s','::1',1,'2026-01-17 20:40:31'),(385,2,'CREAR','VENTAS','Venta registrada. Ticket: 100. Tiempo: 67s','::1',1,'2026-01-17 20:43:05'),(386,2,'CREAR','VENTAS','Venta registrada. Ticket: 101. Tiempo: 88s','::1',1,'2026-01-17 20:45:39'),(387,2,'CREAR','VENTAS','Venta registrada. Ticket: 102. Tiempo: 164s','::1',1,'2026-01-17 20:48:57'),(388,2,'CREAR','COMBOS','Nuevo combo: Combo Leche - Chocolate. Código: 1005. Precio: $5000. Contiene 2 productos.','::1',1,'2026-01-17 20:59:55'),(389,2,'CREAR','VENTAS','Venta registrada. Ticket: 103. Tiempo: 46s','::1',1,'2026-01-17 22:16:38'),(390,2,'CREAR','VENTAS','Venta registrada. Ticket: 104. Tiempo: 74s','::1',1,'2026-01-17 22:21:05'),(391,2,'EDITAR','CATEGORIAS','Se actualizó la categoría: Perfumeria. Cambios: DESCRIPCION: \"Perfumes, dewsodorantes, porductos de limpieza personal\" ➡️ \"Perfumes, desodorantes, porductos de limpieza personal\"','::1',1,'2026-01-17 23:02:32'),(392,2,'CREAR','CATEGORIAS','Se creó la categoría: \"Limpieza\". Descripción: \"Lavandina, Bolsas Residuos, Bolsas Consorcio\"','::1',1,'2026-01-17 23:05:04'),(393,2,'CREAR','PRODUCTOS','Se registró el producto: Bolsa de consorcio Cultura en Limpieza 90x120 (Código: 7790009530563) con imagen en Cloudinary.','::1',1,'2026-01-17 23:14:43'),(394,2,'CREAR','PRODUCTOS','Se registró el producto: Bolsas de Consorcio Cultura en Limpieza 80x110 (Código: 7790109430480) con imagen en Cloudinary.','::1',1,'2026-01-17 23:19:18'),(395,2,'CREAR','PRODUCTOS','Se registró el producto: Lavandina Ayudin Lavanda 1L (Código: 7793253003715) con imagen en Cloudinary.','::1',1,'2026-01-17 23:22:25'),(396,2,'CREAR','CATEGORIAS','Se creó la categoría: \"Golosinas\". Descripción: \"Caramelos, Gomitas, Alfajores\"','::1',1,'2026-01-17 23:23:50'),(397,2,'CREAR','PRODUCTOS','Se registró el producto: Gomitas Mogul Frutales Arcor (Código: 7790580602000) con imagen en Cloudinary.','::1',1,'2026-01-17 23:26:51'),(398,2,'CREAR','PRODUCTOS','Se registró el producto: Rocklets Arcor 20g (Código: 7790580421007) con imagen en Cloudinary.','::1',1,'2026-01-17 23:30:43'),(399,2,'CREAR','PRODUCTOS','Se registró el producto: Pepas Membrillo Tereppín Emery 200g (Código: 7798054220156) con imagen en Cloudinary.','::1',1,'2026-01-17 23:35:32'),(400,2,'CREAR','PRODUCTOS','Se registró el producto: Budin Chocolate Fantasía Nevares 180g (Código: 7798094222318) con imagen en Cloudinary.','::1',1,'2026-01-17 23:39:26'),(401,2,'CREAR','PRODUCTOS','Se registró el producto: Budin Limon Fantasía Nevares 180g (Código: 7798094222325) con imagen en Cloudinary.','::1',1,'2026-01-17 23:43:00'),(402,2,'CREAR','PRODUCTOS','Se registró el producto: Cafe Dolca Original Nescafe 100g (Código: 8445291082199) con imagen en Cloudinary.','::1',1,'2026-01-17 23:46:29'),(403,2,'CREAR','PROVEEDORES','Se registró al proveedor: Cultura en Limpieza SRL. Marca: Cultura en Limpieza. Contacto: Pepe Parada','::1',1,'2026-01-18 00:20:38'),(404,2,'CREAR','PROVEEDORES','Se registró al proveedor: Maxiconsumo Mayorista S.A.. Marca: Varias. Contacto: Karina Gonzalez','::1',1,'2026-01-18 00:23:29'),(405,2,'CREAR','PROVEEDORES','Se registró al proveedor: Nevares S.A.. Marca: Nevares. Contacto: Pedro Scaloni','::1',1,'2026-01-18 00:24:26'),(406,2,'CREAR','COMPRAS','Compra registrada $110000. Recalculo de precios ejecutado.','::1',1,'2026-01-18 00:29:07'),(407,2,'CREAR','COMPRAS','Compra registrada $20000. Recalculo de precios ejecutado.','::1',1,'2026-01-18 00:31:27'),(408,2,'CREAR','PROVEEDORES','Se registró al proveedor: Nescafe. Marca: Dolca. Contacto: Pedro Aznar','::1',1,'2026-01-18 02:51:17'),(409,2,'EDITAR','PROVEEDORES','Se actualizaron los datos del proveedor: Nescafe. Cambios: EMPRESA: \"Nescafe\" ➡️ \"Nescafe S.A.\"','::1',1,'2026-01-18 02:51:33'),(410,2,'CREAR','COMPRAS','Compra registrada $32000. Recalculo de precios ejecutado.','::1',1,'2026-01-18 02:53:41'),(411,2,'CREAR','COMPRAS','Compra registrada $15000. Recalculo de precios ejecutado.','::1',1,'2026-01-18 02:54:41'),(412,2,'CERRAR','ARQUEOS','Cierre ID 42. Venta declarada: 49400. Dif: 0','::1',1,'2026-01-18 02:59:11'),(413,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-18 03:11:40'),(414,2,'CREAR','COMPRAS','Compra registrada $132500. Recalculo de precios ejecutado.','::1',1,'2026-01-18 03:15:46'),(415,2,'CREAR','COMPRAS','Compra registrada $93000. Recalculo de precios ejecutado.','::1',1,'2026-01-18 03:31:32'),(416,2,'PAGO','PROVEEDORES','Se registró un pago de $162.000 al proveedor ID: 8 vía banco desde Caja 2','::1',1,'2026-01-18 03:45:13'),(417,2,'PAGO','PROVEEDORES','Se registró un pago de $15.000 al proveedor ID: 9 vía banco desde Caja 2','::1',1,'2026-01-18 03:46:19'),(418,2,'PAGO','PROVEEDORES','Se registró un pago de $105.000 al proveedor ID: 15 vía banco desde Caja 2','::1',1,'2026-01-18 03:47:54'),(419,2,'PAGO','PROVEEDORES','Se registró un pago de $20.000 al proveedor ID: 22 vía efectivo desde Caja 2','::1',1,'2026-01-18 03:51:17'),(420,2,'PAGO','PROVEEDORES','Se registró un pago de $15.000 al proveedor ID: 22 vía efectivo desde Caja 2','::1',1,'2026-01-18 03:51:31'),(421,2,'PAGO','PROVEEDORES','Se registró un pago de $2.100 al proveedor ID: 19 vía efectivo desde Caja 2','::1',1,'2026-01-18 03:52:11'),(422,2,'PAGO','PROVEEDORES','Se registró un pago de $23.000 al proveedor ID: 19 vía efectivo desde Caja 2','::1',1,'2026-01-18 03:52:23'),(423,2,'CREAR','ARQUEO_MOVIMIENTO','Movimiento manual de Ingreso: $100000. Motivo: Pago a proveedores','::1',1,'2026-01-18 03:55:00'),(424,2,'CERRAR','ARQUEOS','Cierre ID 43. Venta declarada: 0. Dif: 0','::1',1,'2026-01-18 03:57:46'),(425,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-18 12:38:29'),(426,2,'CREAR','VENTAS','Venta registrada. Ticket: 105. Tiempo: 112s','::1',1,'2026-01-18 13:01:56'),(427,2,'CREAR','VENTAS','Venta registrada. Ticket: 106. Tiempo: 107s','::1',1,'2026-01-18 13:04:47'),(428,2,'CREAR','VENTAS','Venta registrada. Ticket: 107. Tiempo: 89s','::1',1,'2026-01-18 13:57:14'),(429,2,'CREAR','VENTAS','Venta registrada. Ticket: 108. Tiempo: 11s','::1',1,'2026-01-18 14:12:10'),(430,2,'CREAR','VENTAS','Venta registrada. Ticket: 109. Tiempo: 31s','::1',1,'2026-01-18 15:30:34'),(431,2,'CREAR','VENTAS','Venta registrada. Ticket: 110. Tiempo: 61s','::1',1,'2026-01-18 15:39:59'),(432,2,'CREAR','VENTAS','Venta registrada. Ticket: 111. Tiempo: 27s','::1',1,'2026-01-18 17:33:59'),(433,2,'CREAR','VENTAS','Venta registrada. Ticket: 112. Tiempo: 30s','::1',1,'2026-01-18 17:36:57'),(434,2,'CREAR','VENTAS','Venta registrada. Ticket: 113. Tiempo: 26s','::1',1,'2026-01-18 17:38:26'),(435,2,'CREAR','VENTAS','Venta registrada. Ticket: 114. Tiempo: 23s','::1',1,'2026-01-18 17:39:45'),(436,2,'EDITAR','USUARIOS','Se actualizaron los datos de: walter@gmail.com. Cambios: NAME: \"Walter TRinidad\" ➡️ \"Walter Trinidad\" | ROLES ANTERIORES: [Cajero/a] ➡️ Sincronizados nuevos roles.','::1',1,'2026-01-18 17:49:44'),(437,2,'CERRAR','ARQUEOS','Cierre ID 44. Venta declarada: 63500. Dif: 0','::1',1,'2026-01-18 17:51:06'),(438,2,'LOGOUT','AUTENTICACION','Sesión expirada','::1',1,'2026-01-18 17:51:45'),(439,6,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-18 17:51:59'),(440,6,'EDITAR','PRODUCTOS','Actualización de producto ID 17. Cambios: PRECIO_VENTA: \"3000.00\" ➡️ \"4500.00\" | VALOR_PORCENTAJE: \"100.00\" ➡️ \"200\" | FECHA_INGRESO: \"Mon Mar 31 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-31\"','::1',1,'2026-01-18 18:07:50'),(441,6,'EDITAR','PRODUCTOS','Actualización de producto ID 17. Cambios: PRECIO_VENTA: \"4500.00\" ➡️ \"3000.00\" | VALOR_PORCENTAJE: \"200.00\" ➡️ \"100\" | FECHA_INGRESO: \"Mon Mar 31 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-03-31\"','::1',1,'2026-01-18 18:10:22'),(442,6,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-18 18:11:54'),(443,6,'CREAR','VENTAS','Venta registrada. Ticket: 115. Tiempo: 30s','::1',1,'2026-01-18 18:12:42'),(444,6,'BACKUP','SISTEMA','Se descargó una copia de seguridad de la base de datos.','::1',1,'2026-01-18 18:20:03'),(445,6,'CREAR','VENTAS','Venta registrada. Ticket: 116. Tiempo: 27s','::1',1,'2026-01-18 18:22:16'),(446,6,'CREAR','VENTAS','Venta registrada. Ticket: 117. Tiempo: 20s','::1',1,'2026-01-18 18:28:35'),(447,6,'CREAR','VENTAS','Venta registrada. Ticket: 118. Tiempo: 46s','::1',1,'2026-01-18 18:33:57'),(448,6,'CREAR','VENTAS','Venta registrada. Ticket: 119. Tiempo: 32s','::1',1,'2026-01-18 19:38:40'),(449,6,'CERRAR','ARQUEOS','Cierre ID 45. Venta declarada: 20800. Dif: 0','::1',1,'2026-01-18 21:04:23'),(450,6,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-18 21:04:30'),(451,6,'LOGIN','AUTENTICACION','Inició sesión en Caja 1. Hardware: ZN1C3SFY','::ffff:127.0.0.1',1,'2026-01-18 21:06:06'),(452,6,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 1. Monto inicial: $10000','::1',1,'2026-01-18 21:08:56'),(453,6,'CREAR','VENTAS','Venta registrada. Ticket: 120. Tiempo: 46s','::1',1,'2026-01-18 21:10:19'),(454,6,'CREAR','VENTAS','Venta registrada. Ticket: 121. Tiempo: 47s','::1',1,'2026-01-18 21:11:59'),(455,6,'CREAR','VENTAS','Venta registrada. Ticket: 122. Tiempo: 23s','::1',1,'2026-01-18 21:12:39'),(456,6,'CREAR','VENTAS','Venta registrada. Ticket: 123. Tiempo: 29s','::1',1,'2026-01-18 21:13:23'),(457,6,'PAGO','PROVEEDORES','Se registró un pago de $110.000 al proveedor ID: 23 vía banco desde Caja 1','::1',1,'2026-01-18 21:19:55'),(458,6,'PAGO','PROVEEDORES','Se registró un pago de $32.000 al proveedor ID: 24 vía banco desde Caja 1','::1',1,'2026-01-18 21:20:24'),(459,6,'PAGO','PROVEEDORES','Se registró un pago de $132.000 al proveedor ID: 21 vía banco desde Caja 1','::1',1,'2026-01-18 21:43:49'),(460,6,'PAGO','PROVEEDORES','Se registró un pago de $500 al proveedor ID: 21 vía banco desde Caja 1','::1',1,'2026-01-18 21:45:14'),(461,6,'PAGO','PROVEEDORES','Se registró un pago de $93.000 al proveedor ID: 22 vía banco desde Caja 1','::1',1,'2026-01-18 21:46:53'),(462,6,'CERRAR','ARQUEOS','Cierre ID 46. Venta declarada: 7600. Dif: 0','::1',1,'2026-01-18 21:49:09'),(463,6,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-18 21:53:21'),(464,2,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-18 21:54:47'),(465,2,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000','::1',1,'2026-01-18 21:55:28'),(466,2,'CREAR','VENTAS','Venta registrada. Ticket: 124. Tiempo: 49s','::1',1,'2026-01-18 22:19:21'),(467,2,'CREAR','VENTAS','Venta registrada. Ticket: 125. Tiempo: 46s','::1',1,'2026-01-18 22:20:37'),(468,2,'CREAR','VENTAS','Venta registrada. Ticket: 126. Tiempo: 51s','::1',1,'2026-01-18 22:25:23'),(469,2,'CREAR','VENTAS','Venta registrada. Ticket: 127. Tiempo: 92s','::1',1,'2026-01-18 22:27:25'),(470,2,'CREAR','VENTAS','Venta registrada. Ticket: 128. Tiempo: 2141s','::1',1,'2026-01-19 00:29:51'),(471,2,'CREAR','VENTAS','Venta registrada. Ticket: 129. Tiempo: 716s','::1',1,'2026-01-19 00:51:58'),(472,2,'CERRAR','ARQUEOS','Cierre ID 47. Venta declarada: 20400. Dif: 0','::1',1,'2026-01-19 00:57:58'),(473,2,'LOGOUT','AUTENTICACION','Sesión cerrada: Cierre manual desde menú','::1',1,'2026-01-19 01:00:01'),(474,6,'LOGIN','AUTENTICACION','Inició sesión en Caja 2. Hardware: ZN1C3SFY','::1',1,'2026-01-19 13:57:27'),(475,6,'CREAR','ARQUEO_CAJA','Apertura de Caja N° 2. Monto inicial: $10000.00','::1',1,'2026-01-19 13:59:30'),(476,6,'CREAR','VENTAS','Venta registrada. Ticket: 130. Tiempo: 43s','::1',1,'2026-01-19 14:14:14'),(477,6,'CREAR','VENTAS','Venta registrada. Ticket: 131. Tiempo: 932s','::1',1,'2026-01-19 14:31:58'),(478,6,'CREAR','VENTAS','Venta registrada. Ticket: 132. Tiempo: 14s','::1',1,'2026-01-19 14:41:56'),(479,6,'CREAR','VENTAS','Venta registrada. Ticket: 133. Tiempo: 34s','::1',1,'2026-01-19 14:48:53'),(480,6,'CREAR','COMPRAS','Compra registrada $15000. Recalculo de precios ejecutado.','::1',1,'2026-01-19 15:41:02'),(481,6,'CREAR','VENTAS','Venta registrada. Ticket: 134. Tiempo: 40s','::1',1,'2026-01-19 15:45:30'),(482,6,'CREAR','VENTAS','Venta registrada. Ticket: 135. Tiempo: 44s','::1',1,'2026-01-19 15:47:15'),(483,6,'CREAR','VENTAS','Venta registrada. Ticket: 136. Tiempo: 70s','::1',1,'2026-01-19 15:49:57'),(484,6,'CREAR','COMPRAS','Compra registrada $14000. Recalculo de precios ejecutado.','::1',1,'2026-01-19 16:29:47'),(485,6,'CREAR','VENTAS','Venta registrada. Ticket: 137. Tiempo: 45s','::1',1,'2026-01-19 16:44:57'),(486,6,'PAGO','CLIENTES_CTA_CTE','Se registró un pago de $8700 en Caja 2 para el cliente ID: 2','::1',1,'2026-01-19 16:47:29'),(487,6,'CREAR','VENTAS','Venta registrada. Ticket: 138. Tiempo: 122s','::1',1,'2026-01-19 16:50:21'),(488,6,'CREAR','VENTAS','Venta registrada. Ticket: 139. Tiempo: 50s','::1',1,'2026-01-19 17:24:07'),(489,6,'CREAR','VENTAS','Venta registrada. Ticket: 140. Tiempo: 43s','::1',1,'2026-01-19 17:39:47'),(490,6,'CREAR','VENTAS','Venta registrada. Ticket: 141. Tiempo: 70s','::1',1,'2026-01-19 17:46:35'),(491,6,'CREAR','VENTAS','Venta registrada. Ticket: 142. Tiempo: 64s','::1',1,'2026-01-19 18:02:05'),(492,6,'CREAR','VENTAS','Venta registrada. Ticket: 143. Tiempo: 35s','::1',1,'2026-01-19 18:08:51'),(493,6,'CREAR','VENTAS','Venta registrada. Ticket: 144. Tiempo: 182s','::1',1,'2026-01-19 18:13:41'),(494,6,'CREAR','VENTAS','Venta registrada. Ticket: 145. Tiempo: 55s','::1',1,'2026-01-19 18:24:17'),(495,6,'CREAR','VENTAS','Venta registrada. Ticket: 146. Tiempo: 27s','::1',1,'2026-01-19 18:28:27'),(496,6,'CREAR','VENTAS','Venta registrada. Ticket: 147. Tiempo: 23s','::1',1,'2026-01-19 18:30:40'),(497,6,'CREAR','VENTAS','Venta registrada. Ticket: 148. Tiempo: 610s','::1',1,'2026-01-19 18:51:27'),(498,6,'CREAR','VENTAS','Venta registrada. Ticket: 149. Tiempo: 50s','::1',1,'2026-01-19 19:41:41'),(499,6,'CREAR','VENTAS','Venta registrada. Ticket: 150. Tiempo: 43s','::1',1,'2026-01-19 19:46:47'),(500,6,'CREAR','VENTAS','Venta registrada. Ticket: 151. Tiempo: 24s','::1',1,'2026-01-19 19:47:52'),(501,6,'CREAR','VENTAS','Venta registrada. Ticket: 152. Tiempo: 249s','::1',1,'2026-01-19 19:58:22'),(502,6,'CREAR','VENTAS','Venta registrada. Ticket: 153. Tiempo: 52s','::1',1,'2026-01-19 20:38:03'),(503,6,'CREAR','VENTAS','Venta registrada. Ticket: 154. Tiempo: 53s','::1',1,'2026-01-19 20:39:44'),(504,6,'EDITAR','CLIENTES','Editó cliente: Morrone Pablo Martín. Cambios detectados: FECHA_NACIMIENTO: \"null\" ➡️ \"1971-08-14\"','::1',1,'2026-01-19 20:47:24'),(505,6,'EDITAR','CLIENTES','Editó cliente: Alba Alisa Rodriguez. Cambios detectados: PUNTOS: \"1228\" ➡️ \"2228\"','::1',1,'2026-01-19 21:19:49'),(506,6,'EDITAR','CLIENTES','Editó cliente: Diego Martin Trinidad. Cambios detectados: FECHA_NACIMIENTO: \"Wed Jan 15 2025 00:00:00 GMT-0300 (hora estándar de Argentina)\" ➡️ \"2025-01-15T03:00:00.000Z\" | PUNTOS: \"538\" ➡️ \"638\"','::1',1,'2026-01-19 21:24:16'),(507,6,'EDITAR','CLIENTES','Editó cliente: Gustavo Vessani. Cambios detectados: PUNTOS: \"166\" ➡️ \"266\"','::1',1,'2026-01-19 21:24:42'),(508,6,'PUNTOS','CLIENTES','Carga manual de 100 puntos al cliente ID 5. Motivo: Premio','::1',1,'2026-01-19 21:35:09'),(509,6,'PUNTOS','CLIENTES','Carga manual de 100 puntos al cliente ID 4. Motivo: Premio','::1',1,'2026-01-19 21:35:25'),(510,6,'PUNTOS','CLIENTES','Carga manual de 100 puntos al cliente ID 4. Motivo: Otro premio','::1',1,'2026-01-19 21:35:52'),(511,6,'CREAR','VENTAS','Venta registrada. Ticket: 155. Tiempo: 40s','::1',1,'2026-01-19 21:37:38'),(512,6,'CREAR','VENTAS','Venta registrada. Ticket: 156. Tiempo: 41s','::1',1,'2026-01-19 21:39:37'),(513,6,'CREAR','VENTAS','Venta registrada. Ticket: 157. Tiempo: 50s','::1',1,'2026-01-19 21:40:50'),(514,6,'CREAR','VENTAS','Venta registrada. Ticket: 158. Tiempo: 16s','::1',1,'2026-01-19 21:43:57'),(515,6,'CREAR','VENTAS','Venta registrada. Ticket: 159. Tiempo: 54s','::1',1,'2026-01-19 22:10:20'),(516,6,'CREAR','VENTAS','Venta registrada. Ticket: 160. Tiempo: 40s','::1',1,'2026-01-19 22:12:53'),(517,6,'CREAR','VENTAS','Venta registrada. Ticket: 161. Tiempo: 48s','::1',1,'2026-01-19 22:14:16'),(518,6,'CREAR','PRODUCTOS','Se registró el producto: Sprite 2L Env. Retornable (Código: 7790895000225) con imagen en Cloudinary.','::1',1,'2026-01-19 22:20:50'),(519,6,'CREAR','COMPRAS','Compra registrada $87500. Recalculo de precios ejecutado.','::1',1,'2026-01-19 22:24:31'),(520,6,'CREAR','COMPRAS','Compra registrada $22000. Recalculo de precios ejecutado.','::1',1,'2026-01-19 22:28:09'),(521,6,'CREAR','COMPRAS','Compra registrada $14000. Recalculo de precios ejecutado.','::1',1,'2026-01-19 22:30:41'),(522,6,'RETIRO','ARQUEOS','Retiro parcial de $10000 en Caja 2. Motivo: Retiro dueño','::1',1,'2026-01-19 22:47:31'),(523,6,'CERRAR','ARQUEOS','Cierre ID 48. Venta declarada: 162700. Dif: 0','::1',1,'2026-01-19 22:53:12'),(524,6,'BACKUP','SISTEMA','Se descargó una copia de seguridad de la base de datos.','::1',1,'2026-01-19 22:55:42'),(525,6,'BACKUP','SISTEMA','Se descargó una copia de seguridad de la base de datos.','::1',1,'2026-01-19 23:00:48');
/*!40000 ALTER TABLE `logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `model_has_roles`
--

DROP TABLE IF EXISTS `model_has_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `model_has_roles` (
  `role_id` bigint(20) unsigned NOT NULL,
  `model_type` varchar(255) NOT NULL,
  `model_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`role_id`,`model_type`,`model_id`),
  KEY `model_has_roles_model_type_model_id_index` (`model_type`,`model_id`),
  CONSTRAINT `model_has_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `model_has_roles`
--

LOCK TABLES `model_has_roles` WRITE;
/*!40000 ALTER TABLE `model_has_roles` DISABLE KEYS */;
/*!40000 ALTER TABLE `model_has_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimiento_cajas`
--

DROP TABLE IF EXISTS `movimiento_cajas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimiento_cajas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `tipo` varchar(255) NOT NULL,
  `monto` decimal(10,2) NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `arqueo_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `pago_id` int(11) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `movimiento_cajas_arqueo_id_foreign` (`arqueo_id`),
  CONSTRAINT `movimiento_cajas_arqueo_id_foreign` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=122 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimiento_cajas`
--

LOCK TABLES `movimiento_cajas` WRITE;
/*!40000 ALTER TABLE `movimiento_cajas` DISABLE KEYS */;
INSERT INTO `movimiento_cajas` VALUES (1,'Ingreso',9700.00,'Venta Ticket N° 1',1,1,NULL,'2026-01-11 16:54:08','2026-01-11 16:54:08'),(2,'Ingreso',20000.00,'Venta Ticket N° 2',2,1,NULL,'2026-01-11 17:47:02','2026-01-11 17:47:02'),(3,'Ingreso',7000.00,'Venta Ticket N° 3',3,1,NULL,'2026-01-11 18:18:06','2026-01-11 18:30:36'),(4,'Ingreso',6000.00,'Venta Ticket N° 4',4,1,NULL,'2026-01-11 18:38:13','2026-01-11 18:38:13'),(5,'Ingreso',6500.00,'Venta Ticket N° 6',5,1,NULL,'2026-01-11 19:03:43','2026-01-11 19:03:43'),(6,'Ingreso',5000.00,'Venta Ticket N° 7',5,1,NULL,'2026-01-11 19:05:26','2026-01-11 19:05:26'),(7,'Ingreso',15200.00,'Venta Ticket N° 8',6,1,NULL,'2026-01-11 19:17:09','2026-01-11 19:17:09'),(8,'Ingreso',5000.00,'Venta Ticket N° 9',6,1,NULL,'2026-01-11 19:32:43','2026-01-11 19:32:43'),(9,'Ingreso',8810.00,'Venta Ticket N° 10',7,1,NULL,'2026-01-11 19:36:03','2026-01-11 19:36:03'),(10,'Ingreso',9150.00,'Venta Ticket N° 11',7,1,NULL,'2026-01-11 19:37:14','2026-01-11 19:37:14'),(11,'Ingreso',3000.00,'Venta Ticket N° 12',8,1,NULL,'2026-01-11 19:41:34','2026-01-11 19:41:34'),(12,'Egreso',3000.00,'Devolución N° 1',8,1,NULL,'2026-01-11 19:43:09','2026-01-11 19:43:09'),(13,'Ingreso',10000.00,'Venta Ticket N° 13',8,1,NULL,'2026-01-11 19:44:29','2026-01-11 19:44:29'),(14,'Ingreso',7200.00,'Venta Ticket N° 14',8,1,NULL,'2026-01-11 19:46:08','2026-01-11 19:46:08'),(15,'Ingreso',5800.00,'Venta Ticket N° 15',8,1,NULL,'2026-01-11 19:51:54','2026-01-11 19:51:54'),(16,'Ingreso',5800.00,'Venta Ticket N° 16',8,1,NULL,'2026-01-11 19:56:55','2026-01-11 19:56:55'),(17,'Ingreso',22910.00,'Venta Ticket N° 17',9,1,NULL,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(18,'Ingreso',8965.50,'Venta Ticket N° 18',10,1,NULL,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(19,'Ingreso',11300.00,'Venta Ticket N° 19',10,1,NULL,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(20,'Ingreso',10000.00,'Venta Ticket N° 20',11,1,NULL,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(21,'Ingreso',3000.00,'Pago Cta. Cte. Cliente: Natalia Oduber',12,1,1,'2026-01-12 14:57:26','2026-01-12 14:57:26'),(22,'Ingreso',3100.00,'Venta Ticket N° 22',12,1,NULL,'2026-01-12 15:19:14','2026-01-12 15:19:14'),(23,'Egreso',1000.00,'Gasto: Pago changa',12,1,NULL,'2026-01-12 15:27:02','2026-01-12 15:27:02'),(24,'Egreso',5500.00,'Pago a proveedor (Cta. Cte.)',12,1,NULL,'2026-01-12 15:34:44','2026-01-12 15:34:44'),(25,'Ingreso',10500.00,'Venta Ticket N° 23',12,1,NULL,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(26,'Ingreso',12000.00,'Venta Ticket N° 25',12,1,NULL,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(27,'Ingreso',7000.00,'Venta Ticket N° 26',14,2,NULL,'2026-01-12 19:09:00','2026-01-12 19:09:00'),(28,'Ingreso',2200.00,'Pago Cta. Cte. Cliente: Diego Martin Trinidad',14,2,2,'2026-01-12 19:13:43','2026-01-12 19:13:43'),(29,'Ingreso',6500.00,'Venta Ticket N° 27',15,1,NULL,'2026-01-12 20:24:15','2026-01-12 20:24:15'),(30,'Ingreso',7100.00,'Venta Ticket N° 28',15,1,NULL,'2026-01-12 20:27:20','2026-01-12 20:27:20'),(31,'Ingreso',7000.00,'Venta Ticket N° 29',15,1,NULL,'2026-01-13 00:04:36','2026-01-13 00:04:36'),(32,'Ingreso',7200.00,'Venta Ticket N° 31',15,1,NULL,'2026-01-13 01:38:46','2026-01-13 01:38:46'),(33,'Ingreso',8000.00,'Venta Ticket N° 32',16,1,NULL,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(34,'Egreso',5000.00,'Gasto: Pago Alicia por limpieza',16,1,NULL,'2026-01-13 18:17:10','2026-01-13 18:17:10'),(35,'Ingreso',7000.00,'Venta Ticket N° 35',16,1,NULL,'2026-01-13 21:11:40','2026-01-13 21:11:40'),(36,'Ingreso',10000.00,'Para pagos servicios',16,1,NULL,'2026-01-14 00:53:12','2026-01-14 00:53:12'),(37,'Ingreso',10000.00,'Venta Ticket N° 36',17,1,NULL,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(38,'Ingreso',10000.00,'Venta Ticket N° 38',18,1,NULL,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(39,'Ingreso',10000.00,'Venta Ticket N° 39',19,1,NULL,'2026-01-14 14:37:46','2026-01-14 14:37:46'),(40,'Ingreso',10000.00,'Venta Ticket N° 40',20,1,NULL,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(41,'Ingreso',10000.00,'Venta Ticket N° 41',21,1,NULL,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(42,'Ingreso',9000.00,'Venta Ticket N° 43',23,1,NULL,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(43,'Ingreso',10000.00,'Venta Ticket N° 44',24,1,NULL,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(44,'Ingreso',10000.00,'Venta Ticket N° 45',25,1,NULL,'2026-01-14 16:45:47','2026-01-14 16:45:47'),(45,'Ingreso',10000.00,'Venta Ticket N° 46',26,1,NULL,'2026-01-14 16:56:25','2026-01-14 16:56:25'),(46,'Ingreso',10000.00,'Venta Ticket N° 47',27,1,NULL,'2026-01-14 17:06:01','2026-01-14 17:06:01'),(47,'Ingreso',6000.00,'Venta Ticket N° 48',28,1,NULL,'2026-01-14 17:12:07','2026-01-14 17:12:07'),(48,'Ingreso',10000.00,'Venta Ticket N° 49',29,1,NULL,'2026-01-14 17:17:36','2026-01-14 17:17:36'),(49,'Ingreso',3000.00,'Venta Ticket N° 50',30,1,NULL,'2026-01-14 17:30:09','2026-01-14 17:30:09'),(50,'Ingreso',3000.00,'Venta Ticket N° 51',30,1,NULL,'2026-01-14 17:31:42','2026-01-14 17:31:42'),(51,'Ingreso',3000.00,'Venta Ticket N° 52',30,1,NULL,'2026-01-14 17:39:40','2026-01-14 17:39:40'),(52,'Ingreso',7000.00,'Venta Ticket N° 53',31,1,NULL,'2026-01-14 18:13:09','2026-01-14 18:13:09'),(53,'Ingreso',10000.00,'Venta Ticket N° 54',32,1,NULL,'2026-01-14 18:23:04','2026-01-14 18:23:04'),(54,'Ingreso',10000.00,'Venta Ticket N° 55',33,1,NULL,'2026-01-14 18:29:32','2026-01-14 18:29:32'),(55,'Ingreso',5000.00,'Venta Ticket N° 56',34,1,NULL,'2026-01-14 19:37:46','2026-01-14 19:37:46'),(56,'Ingreso',5000.00,'Venta Ticket N° 57',34,1,NULL,'2026-01-14 19:40:03','2026-01-14 19:40:03'),(57,'Ingreso',7000.00,'Venta Ticket N° 58',34,1,NULL,'2026-01-14 19:45:53','2026-01-14 19:45:53'),(58,'Ingreso',3000.00,'Venta Ticket N° 59',34,1,NULL,'2026-01-14 19:49:39','2026-01-14 19:49:39'),(59,'Ingreso',500.00,'Venta Ticket N° 60',34,1,NULL,'2026-01-14 19:53:16','2026-01-14 19:53:16'),(60,'Ingreso',1000.00,'Venta Ticket N° 61',34,1,NULL,'2026-01-14 19:59:49','2026-01-14 19:59:49'),(61,'Ingreso',14000.00,'Venta Ticket N° 64',35,1,NULL,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(62,'Ingreso',10000.00,'Venta Ticket N° 71',36,1,NULL,'2026-01-16 18:02:41','2026-01-16 18:02:41'),(63,'Ingreso',10000.00,'Venta Ticket N° 72',36,1,NULL,'2026-01-16 18:07:16','2026-01-16 18:07:16'),(64,'Ingreso',10000.00,'Venta Ticket N° 74',36,1,NULL,'2026-01-16 18:31:58','2026-01-16 18:31:58'),(65,'Ingreso',2000.00,'Venta Ticket N° 75',36,1,NULL,'2026-01-16 19:47:29','2026-01-16 19:47:29'),(66,'Ingreso',10000.00,'Venta Ticket N° 79',36,1,NULL,'2026-01-17 01:25:44','2026-01-17 01:25:44'),(67,'Ingreso',10000.00,'Venta Ticket N° 81',37,1,NULL,'2026-01-17 02:04:28','2026-01-17 02:04:28'),(68,'Ingreso',10000.00,'Venta Ticket N° 83',38,1,NULL,'2026-01-17 02:16:48','2026-01-17 02:16:48'),(69,'Ingreso',10000.00,'Venta Ticket N° 85',39,1,NULL,'2026-01-17 06:35:02','2026-01-17 06:35:02'),(70,'Ingreso',7800.00,'Venta Ticket N° 86',40,2,NULL,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(71,'Ingreso',5000.00,'Venta Ticket N° 87',40,2,NULL,'2026-01-17 15:32:19','2026-01-17 15:32:19'),(72,'Ingreso',5100.00,'Venta Ticket N° 90',41,2,NULL,'2026-01-17 17:47:57','2026-01-17 17:47:57'),(73,'Ingreso',5700.00,'Venta Ticket N° 91',41,2,NULL,'2026-01-17 17:48:39','2026-01-17 17:48:39'),(74,'Ingreso',4000.00,'Venta Ticket N° 94',42,2,NULL,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(75,'Ingreso',5700.00,'Venta Ticket N° 95',42,2,NULL,'2026-01-17 18:47:17','2026-01-17 18:47:17'),(76,'Ingreso',5700.00,'Venta Ticket N° 98',42,2,NULL,'2026-01-17 20:37:41','2026-01-17 20:37:41'),(77,'Ingreso',8000.00,'Venta Ticket N° 103',42,2,NULL,'2026-01-17 22:16:38','2026-01-17 22:16:38'),(78,'Ingreso',26000.00,'Venta Ticket N° 104',42,2,NULL,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(79,'Egreso',20000.00,'Pago a proveedor (Cta. Cte.)',43,1,NULL,'2026-01-18 03:51:17','2026-01-18 03:51:17'),(80,'Egreso',15000.00,'Pago a proveedor (Cta. Cte.)',43,1,NULL,'2026-01-18 03:51:31','2026-01-18 03:51:31'),(81,'Egreso',2100.00,'Pago a proveedor (Cta. Cte.)',43,1,NULL,'2026-01-18 03:52:11','2026-01-18 03:52:11'),(82,'Egreso',23000.00,'Pago a proveedor (Cta. Cte.)',43,1,NULL,'2026-01-18 03:52:23','2026-01-18 03:52:23'),(83,'Ingreso',100000.00,'Pago a proveedores',43,1,NULL,'2026-01-18 06:55:00','2026-01-18 06:55:00'),(84,'Ingreso',12900.00,'Venta Ticket N° 106',44,2,NULL,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(85,'Ingreso',8000.00,'Venta Ticket N° 109',44,2,NULL,'2026-01-18 15:30:34','2026-01-18 15:30:34'),(86,'Ingreso',6800.00,'Venta Ticket N° 110',44,2,NULL,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(87,'Ingreso',6500.00,'Venta Ticket N° 111',44,2,NULL,'2026-01-18 17:33:59','2026-01-18 17:33:59'),(88,'Ingreso',10900.00,'Venta Ticket N° 112',44,2,NULL,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(89,'Ingreso',7900.00,'Venta Ticket N° 113',44,2,NULL,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(90,'Ingreso',10500.00,'Venta Ticket N° 114',44,2,NULL,'2026-01-18 17:39:45','2026-01-18 17:39:45'),(91,'Ingreso',9100.00,'Venta Ticket N° 115',45,2,NULL,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(92,'Ingreso',4700.00,'Venta Ticket N° 116',45,2,NULL,'2026-01-18 18:22:16','2026-01-18 18:22:16'),(93,'Ingreso',7000.00,'Venta Ticket N° 117',45,2,NULL,'2026-01-18 18:28:35','2026-01-18 18:28:35'),(94,'Ingreso',7600.00,'Venta Ticket N° 120',46,1,NULL,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(95,'Ingreso',9000.00,'Venta Ticket N° 124',47,2,NULL,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(96,'Ingreso',4800.00,'Venta Ticket N° 125',47,2,NULL,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(97,'Ingreso',4600.00,'Venta Ticket N° 128',47,2,NULL,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(98,'Ingreso',2000.00,'Venta Ticket N° 129',47,2,NULL,'2026-01-19 00:51:58','2026-01-19 00:51:58'),(99,'Ingreso',5000.00,'Venta Ticket N° 130',48,2,NULL,'2026-01-19 14:14:14','2026-01-19 14:14:14'),(100,'Ingreso',5000.00,'Venta Ticket N° 132',48,2,NULL,'2026-01-19 14:41:56','2026-01-19 14:41:56'),(101,'Ingreso',5000.00,'Venta Ticket N° 134',48,2,NULL,'2026-01-19 15:45:30','2026-01-19 15:45:30'),(102,'Ingreso',8700.00,'Pago Cta. Cte. Cliente: Morrone Pablo Martín',48,2,3,'2026-01-19 16:47:29','2026-01-19 16:47:29'),(103,'Ingreso',8500.00,'Venta Ticket N° 138',48,2,NULL,'2026-01-19 16:50:21','2026-01-19 16:50:21'),(104,'Ingreso',8500.00,'Venta Ticket N° 139',48,2,NULL,'2026-01-19 17:24:07','2026-01-19 17:24:07'),(105,'Ingreso',3000.00,'Venta Ticket N° 140',48,2,NULL,'2026-01-19 17:39:47','2026-01-19 17:39:47'),(106,'Ingreso',5000.00,'Venta Ticket N° 141',48,2,NULL,'2026-01-19 17:46:35','2026-01-19 17:46:35'),(107,'Ingreso',6000.00,'Venta Ticket N° 142',48,2,NULL,'2026-01-19 18:02:05','2026-01-19 18:02:05'),(108,'Ingreso',6000.00,'Venta Ticket N° 143',48,2,NULL,'2026-01-19 18:08:50','2026-01-19 18:08:50'),(109,'Ingreso',6000.00,'Venta Ticket N° 144',48,2,NULL,'2026-01-19 18:13:41','2026-01-19 18:13:41'),(110,'Ingreso',7000.00,'Venta Ticket N° 145',48,2,NULL,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(111,'Ingreso',3000.00,'Venta Ticket N° 146',48,2,NULL,'2026-01-19 18:28:26','2026-01-19 18:28:26'),(112,'Ingreso',3000.00,'Venta Ticket N° 147',48,2,NULL,'2026-01-19 18:30:39','2026-01-19 18:30:39'),(113,'Ingreso',4000.00,'Venta Ticket N° 150',48,2,NULL,'2026-01-19 19:46:47','2026-01-19 19:46:47'),(114,'Ingreso',7000.00,'Venta Ticket N° 151',48,2,NULL,'2026-01-19 19:47:52','2026-01-19 19:47:52'),(115,'Ingreso',11000.00,'Venta Ticket N° 153',48,2,NULL,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(116,'Ingreso',10000.00,'Venta Ticket N° 154',48,2,NULL,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(117,'Ingreso',13000.00,'Venta Ticket N° 155',48,2,NULL,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(118,'Ingreso',9000.00,'Venta Ticket N° 157',48,2,NULL,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(119,'Ingreso',7000.00,'Venta Ticket N° 158',48,2,NULL,'2026-01-19 21:43:57','2026-01-19 21:43:57'),(120,'Ingreso',20100.00,'Venta Ticket N° 159',48,2,NULL,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(121,'Ingreso',10600.00,'Venta Ticket N° 160',48,2,NULL,'2026-01-19 22:12:53','2026-01-19 22:12:53');
/*!40000 ALTER TABLE `movimiento_cajas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos`
--

DROP TABLE IF EXISTS `movimientos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `producto_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `tipo` enum('entrada','salida') NOT NULL,
  `origen` enum('compra','venta','devolucion','ajuste') NOT NULL,
  `origen_id` bigint(20) unsigned NOT NULL,
  `compra_id` bigint(20) unsigned DEFAULT NULL,
  `venta_id` bigint(20) unsigned DEFAULT NULL,
  `ajuste_id` bigint(20) unsigned DEFAULT NULL,
  `devolucion_id` bigint(20) unsigned DEFAULT NULL,
  `cantidad` decimal(10,2) NOT NULL,
  `fecha` datetime NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `movimientos_producto_id_foreign` (`producto_id`),
  KEY `movimientos_empresa_id_foreign` (`empresa_id`),
  KEY `movimientos_usuario_id_foreign` (`usuario_id`),
  KEY `movimientos_compra_id_foreign` (`compra_id`),
  KEY `movimientos_venta_id_foreign` (`venta_id`),
  KEY `movimientos_ajuste_id_foreign` (`ajuste_id`),
  KEY `fk_movimientos_devolucion` (`devolucion_id`),
  CONSTRAINT `fk_movimientos_compras` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_movimientos_devolucion` FOREIGN KEY (`devolucion_id`) REFERENCES `devoluciones` (`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_1` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_2` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_3` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `movimientos_ibfk_4` FOREIGN KEY (`ajuste_id`) REFERENCES `ajustes` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=411 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos`
--

LOCK TABLES `movimientos` WRITE;
/*!40000 ALTER TABLE `movimientos` DISABLE KEYS */;
INSERT INTO `movimientos` VALUES (1,4,1,'entrada','compra',1,1,NULL,NULL,NULL,10.00,'2026-01-01 00:00:00',1,'2026-01-11 16:52:25','2026-01-11 16:52:25'),(2,16,1,'entrada','compra',2,2,NULL,NULL,NULL,10.00,'2026-01-01 00:00:00',1,'2026-01-11 16:53:12','2026-01-11 16:53:12'),(3,31,1,'entrada','compra',3,3,NULL,NULL,NULL,10.00,'2026-01-02 00:00:00',1,'2026-01-11 17:41:26','2026-01-11 17:41:26'),(4,15,1,'entrada','devolucion',1,NULL,NULL,NULL,1,1.00,'2026-01-08 00:00:00',1,'2026-01-11 19:43:09','2026-01-11 19:43:09'),(5,12,1,'salida','venta',16,NULL,16,NULL,NULL,250.00,'2026-01-08 00:00:00',1,'2026-01-11 19:56:55','2026-01-11 19:56:55'),(6,13,1,'salida','venta',16,NULL,16,NULL,NULL,250.00,'2026-01-08 00:00:00',1,'2026-01-11 19:56:55','2026-01-11 19:56:55'),(7,4,1,'salida','ajuste',1,NULL,NULL,NULL,NULL,1.00,'2026-01-08 17:05:00',1,'2026-01-11 20:05:45','2026-01-11 20:05:45'),(8,15,1,'entrada','ajuste',2,NULL,NULL,NULL,NULL,1.00,'2026-01-08 17:09:00',1,'2026-01-11 20:09:58','2026-01-11 20:09:58'),(9,3,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(10,5,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(11,7,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(12,8,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(13,11,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(14,14,1,'salida','venta',17,NULL,17,NULL,NULL,1.00,'2026-01-09 00:00:00',1,'2026-01-11 20:14:21','2026-01-11 20:14:21'),(15,6,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(16,19,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(17,20,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(18,21,1,'salida','venta',18,NULL,18,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:22:08','2026-01-11 20:22:08'),(19,22,1,'salida','venta',19,NULL,19,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(20,27,1,'salida','venta',19,NULL,19,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(21,28,1,'salida','venta',19,NULL,19,NULL,NULL,1.00,'2026-01-10 00:00:00',1,'2026-01-11 20:24:03','2026-01-11 20:24:03'),(22,31,1,'salida','venta',20,NULL,20,NULL,NULL,1.00,'2026-01-11 00:00:00',1,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(23,15,1,'salida','venta',20,NULL,20,NULL,NULL,1.00,'2026-01-11 00:00:00',1,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(24,32,1,'salida','venta',20,NULL,20,NULL,NULL,1.00,'2026-01-11 00:00:00',1,'2026-01-11 20:30:05','2026-01-11 20:30:05'),(25,4,1,'salida','venta',21,NULL,21,NULL,NULL,1.00,'2026-01-11 00:00:00',1,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(26,5,1,'salida','venta',21,NULL,21,NULL,NULL,1.00,'2026-01-11 00:00:00',1,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(27,18,1,'salida','venta',21,NULL,21,NULL,NULL,1.00,'2026-01-11 00:00:00',1,'2026-01-11 20:31:04','2026-01-11 20:31:04'),(28,4,1,'salida','venta',22,NULL,22,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 15:19:14','2026-01-12 15:19:14'),(29,4,1,'salida','venta',23,NULL,23,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(30,9,1,'salida','venta',23,NULL,23,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(31,10,1,'salida','venta',23,NULL,23,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(32,28,1,'salida','venta',23,NULL,23,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 15:55:32','2026-01-12 15:55:32'),(33,4,1,'salida','venta',24,NULL,24,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(34,14,1,'salida','venta',24,NULL,24,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(35,8,1,'salida','venta',24,NULL,24,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(36,2,1,'salida','venta',24,NULL,24,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(37,23,1,'salida','venta',24,NULL,24,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(38,10,1,'salida','venta',24,NULL,24,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:23:23','2026-01-12 16:23:23'),(39,31,1,'salida','venta',25,NULL,25,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(40,9,1,'salida','venta',25,NULL,25,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(41,1,1,'salida','venta',25,NULL,25,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(42,30,1,'salida','venta',25,NULL,25,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 16:25:43','2026-01-12 16:25:43'),(43,4,1,'salida','venta',26,NULL,26,NULL,NULL,2.00,'2026-01-12 00:00:00',2,'2026-01-12 19:09:00','2026-01-12 19:09:00'),(44,4,1,'salida','venta',27,NULL,27,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 20:24:15','2026-01-12 20:24:15'),(45,15,1,'salida','venta',27,NULL,27,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 20:24:15','2026-01-12 20:24:15'),(46,4,1,'salida','venta',28,NULL,28,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 20:27:20','2026-01-12 20:27:20'),(47,9,1,'salida','venta',28,NULL,28,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-12 20:27:20','2026-01-12 20:27:20'),(48,4,1,'salida','venta',29,NULL,29,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-13 00:04:36','2026-01-13 00:04:36'),(49,14,1,'salida','venta',29,NULL,29,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-13 00:04:36','2026-01-13 00:04:36'),(50,15,1,'salida','venta',30,NULL,30,NULL,NULL,1.00,'2026-01-12 00:00:00',1,'2026-01-13 00:06:56','2026-01-13 00:06:56'),(51,9,1,'salida','venta',31,NULL,31,NULL,NULL,3.00,'2026-01-12 00:00:00',1,'2026-01-13 01:38:46','2026-01-13 01:38:46'),(52,1,1,'salida','venta',32,NULL,32,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(53,11,1,'salida','venta',32,NULL,32,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(54,10,1,'salida','venta',32,NULL,32,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(55,14,1,'salida','venta',32,NULL,32,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 18:12:23','2026-01-13 18:12:23'),(56,4,1,'salida','venta',33,NULL,33,NULL,NULL,2.00,'2026-01-13 00:00:00',1,'2026-01-13 18:15:32','2026-01-13 18:15:32'),(57,14,1,'salida','venta',34,NULL,34,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 21:10:16','2026-01-13 21:10:16'),(58,12,1,'salida','venta',34,NULL,34,NULL,NULL,250.00,'2026-01-13 00:00:00',1,'2026-01-13 21:10:16','2026-01-13 21:10:16'),(59,13,1,'salida','venta',34,NULL,34,NULL,NULL,250.00,'2026-01-13 00:00:00',1,'2026-01-13 21:10:16','2026-01-13 21:10:16'),(60,4,1,'salida','venta',35,NULL,35,NULL,NULL,2.00,'2026-01-13 00:00:00',1,'2026-01-13 21:11:40','2026-01-13 21:11:40'),(61,31,1,'salida','venta',36,NULL,36,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(62,15,1,'salida','venta',36,NULL,36,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(63,32,1,'salida','venta',36,NULL,36,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 22:13:33','2026-01-13 22:13:33'),(64,1,1,'salida','venta',37,NULL,37,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 23:40:24','2026-01-13 23:40:24'),(65,11,1,'salida','venta',37,NULL,37,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 23:40:24','2026-01-13 23:40:24'),(66,10,1,'salida','venta',37,NULL,37,NULL,NULL,1.00,'2026-01-13 00:00:00',1,'2026-01-13 23:40:24','2026-01-13 23:40:24'),(67,31,1,'salida','venta',38,NULL,38,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(68,15,1,'salida','venta',38,NULL,38,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(69,32,1,'salida','venta',38,NULL,38,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 14:22:10','2026-01-14 14:22:10'),(70,4,1,'salida','venta',39,NULL,39,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 14:37:46','2026-01-14 14:37:46'),(71,30,1,'salida','venta',39,NULL,39,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 14:37:46','2026-01-14 14:37:46'),(72,6,1,'salida','venta',40,NULL,40,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(73,1,1,'salida','venta',40,NULL,40,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(74,4,1,'salida','venta',40,NULL,40,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 14:53:34','2026-01-14 14:53:34'),(75,29,1,'salida','venta',41,NULL,41,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(76,28,1,'salida','venta',41,NULL,41,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(77,8,1,'salida','venta',41,NULL,41,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(78,20,1,'salida','venta',41,NULL,41,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(79,14,1,'salida','venta',41,NULL,41,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 15:12:16','2026-01-14 15:12:16'),(80,33,1,'salida','venta',42,NULL,42,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:08:17','2026-01-14 16:08:17'),(81,19,1,'salida','venta',42,NULL,42,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:08:17','2026-01-14 16:08:17'),(82,23,1,'salida','venta',43,NULL,43,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(83,19,1,'salida','venta',43,NULL,43,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(84,14,1,'salida','venta',43,NULL,43,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:19:26','2026-01-14 16:19:26'),(85,31,1,'salida','venta',44,NULL,44,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(86,32,1,'salida','venta',44,NULL,44,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(87,16,1,'salida','venta',44,NULL,44,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 16:25:10','2026-01-14 16:25:10'),(88,4,1,'salida','venta',45,NULL,45,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 16:45:47','2026-01-14 16:45:47'),(89,15,1,'salida','venta',45,NULL,45,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 16:45:47','2026-01-14 16:45:47'),(90,4,1,'salida','venta',46,NULL,46,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 16:56:25','2026-01-14 16:56:25'),(91,16,1,'salida','venta',46,NULL,46,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 16:56:25','2026-01-14 16:56:25'),(92,4,1,'salida','venta',47,NULL,47,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 17:06:01','2026-01-14 17:06:01'),(93,16,1,'salida','venta',47,NULL,47,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 17:06:01','2026-01-14 17:06:01'),(94,32,1,'salida','venta',48,NULL,48,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 17:12:07','2026-01-14 17:12:07'),(95,15,1,'salida','venta',49,NULL,49,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 17:17:36','2026-01-14 17:17:36'),(96,4,1,'salida','venta',49,NULL,49,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 17:17:36','2026-01-14 17:17:36'),(97,20,1,'salida','venta',50,NULL,50,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 17:30:09','2026-01-14 17:30:09'),(98,6,1,'salida','venta',50,NULL,50,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 17:30:09','2026-01-14 17:30:09'),(99,14,1,'salida','venta',53,NULL,53,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 18:13:09','2026-01-14 18:13:09'),(100,4,1,'salida','venta',54,NULL,54,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 18:23:04','2026-01-14 18:23:04'),(101,15,1,'salida','venta',54,NULL,54,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 18:23:04','2026-01-14 18:23:04'),(102,15,1,'salida','venta',55,NULL,55,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 18:29:32','2026-01-14 18:29:32'),(103,4,1,'salida','venta',55,NULL,55,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 18:29:32','2026-01-14 18:29:32'),(104,4,1,'salida','venta',56,NULL,56,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 19:37:46','2026-01-14 19:37:46'),(105,4,1,'salida','venta',58,NULL,58,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 19:45:53','2026-01-14 19:45:53'),(106,15,1,'salida','venta',59,NULL,59,NULL,NULL,2.00,'2026-01-14 00:00:00',1,'2026-01-14 19:49:39','2026-01-14 19:49:39'),(107,14,1,'salida','venta',60,NULL,60,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 19:53:16','2026-01-14 19:53:16'),(108,15,1,'salida','venta',61,NULL,61,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 19:59:49','2026-01-14 19:59:49'),(109,32,1,'salida','venta',62,NULL,62,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 20:52:31','2026-01-14 20:52:31'),(110,20,1,'entrada','compra',7,NULL,NULL,NULL,NULL,1.00,'2026-01-14 00:00:00',1,'2026-01-14 22:03:31','2026-01-14 22:03:31'),(111,12,1,'salida','venta',63,NULL,63,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 14:09:22','2026-01-15 14:09:22'),(112,13,1,'salida','venta',63,NULL,63,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 14:09:22','2026-01-15 14:09:22'),(113,31,1,'salida','venta',64,NULL,64,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(114,15,1,'salida','venta',64,NULL,64,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(115,4,1,'salida','venta',64,NULL,64,NULL,NULL,2.00,'2026-01-15 00:00:00',1,'2026-01-15 14:50:39','2026-01-15 14:50:39'),(116,14,1,'salida','venta',65,NULL,65,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:03:22','2026-01-15 15:03:22'),(117,12,1,'salida','venta',65,NULL,65,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:03:22','2026-01-15 15:03:22'),(118,13,1,'salida','venta',65,NULL,65,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:03:22','2026-01-15 15:03:22'),(119,1,1,'salida','venta',66,NULL,66,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:05:56','2026-01-15 15:05:56'),(120,10,1,'salida','venta',66,NULL,66,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:05:56','2026-01-15 15:05:56'),(121,16,1,'salida','venta',66,NULL,66,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:05:56','2026-01-15 15:05:56'),(122,13,1,'entrada','compra',8,NULL,NULL,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:12:50','2026-01-15 15:12:50'),(123,12,1,'entrada','compra',8,NULL,NULL,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:12:50','2026-01-15 15:12:50'),(124,12,1,'salida','venta',67,NULL,67,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:36:46','2026-01-15 15:36:46'),(125,13,1,'salida','venta',67,NULL,67,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:36:46','2026-01-15 15:36:46'),(126,16,1,'salida','venta',67,NULL,67,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:36:46','2026-01-15 15:36:46'),(127,12,1,'entrada','compra',9,NULL,NULL,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:44:20','2026-01-15 15:44:20'),(128,13,1,'entrada','compra',9,NULL,NULL,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:44:20','2026-01-15 15:44:20'),(129,12,1,'salida','venta',68,NULL,68,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:46:02','2026-01-15 15:46:02'),(130,13,1,'salida','venta',68,NULL,68,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:46:02','2026-01-15 15:46:02'),(131,12,1,'entrada','compra',10,NULL,NULL,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:51:44','2026-01-15 15:51:44'),(132,13,1,'entrada','compra',10,NULL,NULL,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:51:44','2026-01-15 15:51:44'),(133,12,1,'salida','venta',69,NULL,69,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:52:36','2026-01-15 15:52:36'),(134,13,1,'salida','venta',69,NULL,69,NULL,NULL,250.00,'2026-01-15 00:00:00',1,'2026-01-15 15:52:36','2026-01-15 15:52:36'),(135,4,1,'salida','venta',69,NULL,69,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:52:36','2026-01-15 15:52:36'),(136,29,1,'salida','venta',70,NULL,70,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:55:51','2026-01-15 15:55:51'),(137,1,1,'salida','venta',70,NULL,70,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:55:51','2026-01-15 15:55:51'),(138,7,1,'salida','venta',70,NULL,70,NULL,NULL,1.00,'2026-01-15 00:00:00',1,'2026-01-15 15:55:51','2026-01-15 15:55:51'),(139,20,1,'entrada','compra',11,NULL,NULL,NULL,NULL,10.00,'2026-01-15 00:00:00',1,'2026-01-15 22:59:24','2026-01-15 22:59:24'),(140,20,1,'entrada','compra',12,NULL,NULL,NULL,NULL,10.00,'2026-01-16 00:00:00',1,'2026-01-16 13:34:37','2026-01-16 13:34:37'),(141,27,1,'entrada','compra',13,NULL,NULL,NULL,NULL,10.00,'2026-01-16 00:00:00',1,'2026-01-16 13:36:47','2026-01-16 13:36:47'),(142,4,1,'salida','venta',71,NULL,71,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-16 18:02:41','2026-01-16 18:02:41'),(143,30,1,'salida','venta',71,NULL,71,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 18:02:41','2026-01-16 18:02:41'),(144,1,1,'salida','venta',73,NULL,73,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-16 18:25:44','2026-01-16 18:25:44'),(145,33,1,'salida','venta',73,NULL,73,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 18:25:44','2026-01-16 18:25:44'),(146,22,1,'salida','venta',73,NULL,73,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 18:25:44','2026-01-16 18:25:44'),(147,15,1,'salida','venta',74,NULL,74,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 18:31:58','2026-01-16 18:31:58'),(148,4,1,'salida','venta',74,NULL,74,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-16 18:31:58','2026-01-16 18:31:58'),(149,1,1,'salida','venta',75,NULL,75,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 19:47:29','2026-01-16 19:47:29'),(150,3,1,'salida','venta',75,NULL,75,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-16 19:47:29','2026-01-16 19:47:29'),(151,15,1,'entrada','compra',14,NULL,NULL,NULL,NULL,10.00,'2026-01-16 00:00:00',1,'2026-01-16 22:42:47','2026-01-16 22:42:47'),(152,15,1,'entrada','compra',15,NULL,NULL,NULL,NULL,10.00,'2026-01-16 00:00:00',1,'2026-01-16 22:45:05','2026-01-16 22:45:05'),(153,4,1,'entrada','compra',16,NULL,NULL,NULL,NULL,20.00,'2026-01-16 00:00:00',1,'2026-01-16 23:07:51','2026-01-16 23:07:51'),(154,9,1,'salida','venta',76,NULL,76,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 23:09:35','2026-01-16 23:09:35'),(155,4,1,'salida','venta',76,NULL,76,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 23:09:35','2026-01-16 23:09:35'),(156,28,1,'salida','venta',77,NULL,77,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 23:10:47','2026-01-16 23:10:47'),(157,14,1,'salida','venta',77,NULL,77,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 23:10:47','2026-01-16 23:10:47'),(158,19,1,'salida','venta',78,NULL,78,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 23:21:22','2026-01-16 23:21:22'),(159,4,1,'salida','venta',78,NULL,78,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-16 23:21:22','2026-01-16 23:21:22'),(160,4,1,'entrada','compra',17,NULL,NULL,NULL,NULL,10.00,'2026-01-16 00:00:00',1,'2026-01-17 01:06:59','2026-01-17 01:06:59'),(161,4,1,'entrada','compra',18,NULL,NULL,NULL,NULL,10.00,'2026-01-16 00:00:00',1,'2026-01-17 01:11:07','2026-01-17 01:11:07'),(162,15,1,'salida','venta',79,NULL,79,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 01:25:44','2026-01-17 01:25:44'),(163,4,1,'salida','venta',79,NULL,79,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-17 01:25:44','2026-01-17 01:25:44'),(164,1,1,'salida','venta',80,NULL,80,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 01:44:48','2026-01-17 01:44:48'),(165,20,1,'salida','venta',80,NULL,80,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 01:44:48','2026-01-17 01:44:48'),(166,15,1,'salida','venta',81,NULL,81,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 02:04:28','2026-01-17 02:04:28'),(167,4,1,'salida','venta',81,NULL,81,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-17 02:04:28','2026-01-17 02:04:28'),(168,15,1,'salida','venta',82,NULL,82,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 02:05:49','2026-01-17 02:05:49'),(169,4,1,'salida','venta',82,NULL,82,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-17 02:05:49','2026-01-17 02:05:49'),(170,14,1,'salida','venta',83,NULL,83,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-17 02:16:48','2026-01-17 02:16:48'),(171,32,1,'salida','venta',83,NULL,83,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 02:16:48','2026-01-17 02:16:48'),(172,4,1,'salida','venta',84,NULL,84,NULL,NULL,2.00,'2026-01-16 00:00:00',1,'2026-01-17 02:17:32','2026-01-17 02:17:32'),(173,17,1,'salida','venta',84,NULL,84,NULL,NULL,1.00,'2026-01-16 00:00:00',1,'2026-01-17 02:17:32','2026-01-17 02:17:32'),(174,15,1,'salida','venta',85,NULL,85,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 06:35:02','2026-01-17 06:35:02'),(175,4,1,'salida','venta',85,NULL,85,NULL,NULL,2.00,'2026-01-17 00:00:00',1,'2026-01-17 06:35:02','2026-01-17 06:35:02'),(176,12,1,'salida','venta',86,NULL,86,NULL,NULL,250.00,'2026-01-17 00:00:00',2,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(177,13,1,'salida','venta',86,NULL,86,NULL,NULL,250.00,'2026-01-17 00:00:00',2,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(178,4,1,'salida','venta',86,NULL,86,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(179,14,1,'salida','venta',86,NULL,86,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 15:07:56','2026-01-17 15:07:56'),(180,4,1,'salida','venta',87,NULL,87,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 15:32:19','2026-01-17 15:32:19'),(181,16,1,'salida','venta',87,NULL,87,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 15:32:19','2026-01-17 15:32:19'),(182,9,1,'salida','venta',88,NULL,88,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 16:34:40','2026-01-17 16:34:40'),(183,24,1,'salida','venta',88,NULL,88,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 16:34:40','2026-01-17 16:34:40'),(184,35,1,'entrada','compra',19,NULL,NULL,NULL,NULL,50.00,'2026-01-17 00:00:00',2,'2026-01-17 17:14:41','2026-01-17 17:14:41'),(185,34,1,'entrada','compra',19,NULL,NULL,NULL,NULL,50.00,'2026-01-17 00:00:00',2,'2026-01-17 17:14:41','2026-01-17 17:14:41'),(186,9,1,'salida','venta',89,NULL,89,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 17:16:40','2026-01-17 17:16:40'),(187,34,1,'salida','venta',89,NULL,89,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 17:16:40','2026-01-17 17:16:40'),(188,35,1,'salida','venta',90,NULL,90,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 17:47:57','2026-01-17 17:47:57'),(189,30,1,'salida','venta',90,NULL,90,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 17:47:57','2026-01-17 17:47:57'),(190,18,1,'salida','venta',91,NULL,91,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 17:48:39','2026-01-17 17:48:39'),(191,17,1,'salida','venta',91,NULL,91,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 17:48:39','2026-01-17 17:48:39'),(192,9,1,'salida','venta',92,NULL,92,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 17:49:18','2026-01-17 17:49:18'),(193,34,1,'salida','venta',92,NULL,92,NULL,NULL,1.00,'2026-01-17 00:00:00',1,'2026-01-17 17:49:18','2026-01-17 17:49:18'),(194,33,1,'salida','venta',93,NULL,93,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 17:59:13','2026-01-17 17:59:13'),(195,15,1,'salida','venta',93,NULL,93,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 17:59:13','2026-01-17 17:59:13'),(196,1,1,'salida','venta',94,NULL,94,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(197,10,1,'salida','venta',94,NULL,94,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(198,1,1,'salida','venta',94,NULL,94,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:00:02','2026-01-17 18:00:02'),(199,9,1,'salida','venta',95,NULL,95,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:47:17','2026-01-17 18:47:17'),(200,34,1,'salida','venta',95,NULL,95,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:47:17','2026-01-17 18:47:17'),(201,9,1,'salida','venta',96,NULL,96,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:48:34','2026-01-17 18:48:34'),(202,34,1,'salida','venta',96,NULL,96,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:48:34','2026-01-17 18:48:34'),(203,9,1,'salida','venta',97,NULL,97,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:49:37','2026-01-17 18:49:37'),(204,34,1,'salida','venta',97,NULL,97,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:49:37','2026-01-17 18:49:37'),(205,11,1,'salida','venta',97,NULL,97,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 18:49:37','2026-01-17 18:49:37'),(206,9,1,'entrada','compra',20,NULL,NULL,NULL,NULL,90.00,'2026-01-17 00:00:00',2,'2026-01-17 19:43:19','2026-01-17 19:43:19'),(207,9,1,'salida','venta',98,NULL,98,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:37:41','2026-01-17 20:37:41'),(208,34,1,'salida','venta',98,NULL,98,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:37:41','2026-01-17 20:37:41'),(209,29,1,'salida','venta',99,NULL,99,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(210,8,1,'salida','venta',99,NULL,99,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(211,9,1,'salida','venta',99,NULL,99,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(212,34,1,'salida','venta',99,NULL,99,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:40:31','2026-01-17 20:40:31'),(213,20,1,'salida','venta',100,NULL,100,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(214,33,1,'salida','venta',100,NULL,100,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(215,34,1,'salida','venta',100,NULL,100,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(216,9,1,'salida','venta',100,NULL,100,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:43:05','2026-01-17 20:43:05'),(217,11,1,'salida','venta',101,NULL,101,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(218,24,1,'salida','venta',101,NULL,101,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(219,34,1,'salida','venta',101,NULL,101,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(220,9,1,'salida','venta',101,NULL,101,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:45:38','2026-01-17 20:45:38'),(221,9,1,'salida','venta',102,NULL,102,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:48:57','2026-01-17 20:48:57'),(222,34,1,'salida','venta',102,NULL,102,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 20:48:57','2026-01-17 20:48:57'),(223,34,1,'salida','venta',103,NULL,103,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:16:38','2026-01-17 22:16:38'),(224,9,1,'salida','venta',103,NULL,103,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:16:38','2026-01-17 22:16:38'),(225,17,1,'salida','venta',103,NULL,103,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:16:38','2026-01-17 22:16:38'),(226,20,1,'salida','venta',104,NULL,104,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(227,8,1,'salida','venta',104,NULL,104,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(228,5,1,'salida','venta',104,NULL,104,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(229,3,1,'salida','venta',104,NULL,104,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(230,6,1,'salida','venta',104,NULL,104,NULL,NULL,1.00,'2026-01-17 00:00:00',2,'2026-01-17 22:21:05','2026-01-17 22:21:05'),(231,42,1,'entrada','compra',21,NULL,NULL,NULL,NULL,50.00,'2026-01-17 00:00:00',2,'2026-01-18 00:29:07','2026-01-18 00:29:07'),(232,43,1,'entrada','compra',21,NULL,NULL,NULL,NULL,50.00,'2026-01-17 00:00:00',2,'2026-01-18 00:29:07','2026-01-18 00:29:07'),(233,42,1,'entrada','compra',22,NULL,NULL,NULL,NULL,10.00,'2026-01-17 00:00:00',2,'2026-01-18 00:31:27','2026-01-18 00:31:27'),(234,43,1,'entrada','compra',22,NULL,NULL,NULL,NULL,10.00,'2026-01-17 00:00:00',2,'2026-01-18 00:31:27','2026-01-18 00:31:27'),(235,44,1,'entrada','compra',23,NULL,NULL,NULL,NULL,20.00,'2026-01-17 00:00:00',2,'2026-01-18 02:53:41','2026-01-18 02:53:41'),(236,44,1,'entrada','compra',24,NULL,NULL,NULL,NULL,10.00,'2026-01-17 00:00:00',2,'2026-01-18 02:54:41','2026-01-18 02:54:41'),(237,36,1,'entrada','compra',25,NULL,NULL,NULL,NULL,50.00,'2026-01-18 00:00:00',2,'2026-01-18 03:15:46','2026-01-18 03:15:46'),(238,37,1,'entrada','compra',25,NULL,NULL,NULL,NULL,50.00,'2026-01-18 00:00:00',2,'2026-01-18 03:15:46','2026-01-18 03:15:46'),(239,41,1,'entrada','compra',26,NULL,NULL,NULL,NULL,30.00,'2026-01-18 00:00:00',2,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(240,39,1,'entrada','compra',26,NULL,NULL,NULL,NULL,30.00,'2026-01-18 00:00:00',2,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(241,40,1,'entrada','compra',26,NULL,NULL,NULL,NULL,30.00,'2026-01-18 00:00:00',2,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(242,38,1,'entrada','compra',26,NULL,NULL,NULL,NULL,30.00,'2026-01-18 00:00:00',2,'2026-01-18 03:31:32','2026-01-18 03:31:32'),(243,34,1,'salida','venta',105,NULL,105,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(244,9,1,'salida','venta',105,NULL,105,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(245,1,1,'salida','venta',105,NULL,105,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(246,39,1,'salida','venta',105,NULL,105,NULL,NULL,2.00,'2026-01-18 00:00:00',2,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(247,17,1,'salida','venta',105,NULL,105,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(248,40,1,'salida','venta',105,NULL,105,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:01:56','2026-01-18 13:01:56'),(249,16,1,'salida','venta',106,NULL,106,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(250,42,1,'salida','venta',106,NULL,106,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(251,36,1,'salida','venta',106,NULL,106,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(252,38,1,'salida','venta',106,NULL,106,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(253,44,1,'salida','venta',106,NULL,106,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(254,41,1,'salida','venta',106,NULL,106,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:04:47','2026-01-18 13:04:47'),(255,38,1,'salida','venta',107,NULL,107,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:57:14','2026-01-18 13:57:14'),(256,27,1,'salida','venta',107,NULL,107,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 13:57:14','2026-01-18 13:57:14'),(257,12,1,'salida','venta',108,NULL,108,NULL,NULL,250.00,'2026-01-18 00:00:00',2,'2026-01-18 14:12:10','2026-01-18 14:12:10'),(258,13,1,'salida','venta',108,NULL,108,NULL,NULL,250.00,'2026-01-18 00:00:00',2,'2026-01-18 14:12:10','2026-01-18 14:12:10'),(259,34,1,'salida','venta',109,NULL,109,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 15:30:34','2026-01-18 15:30:34'),(260,9,1,'salida','venta',109,NULL,109,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 15:30:34','2026-01-18 15:30:34'),(261,32,1,'salida','venta',109,NULL,109,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 15:30:34','2026-01-18 15:30:34'),(262,28,1,'salida','venta',110,NULL,110,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(263,38,1,'salida','venta',110,NULL,110,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(264,41,1,'salida','venta',110,NULL,110,NULL,NULL,2.00,'2026-01-18 00:00:00',2,'2026-01-18 15:39:59','2026-01-18 15:39:59'),(265,14,1,'salida','venta',111,NULL,111,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:33:59','2026-01-18 17:33:59'),(266,3,1,'salida','venta',111,NULL,111,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:33:59','2026-01-18 17:33:59'),(267,4,1,'salida','venta',112,NULL,112,NULL,NULL,2.00,'2026-01-18 00:00:00',2,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(268,16,1,'salida','venta',112,NULL,112,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(269,39,1,'salida','venta',112,NULL,112,NULL,NULL,2.00,'2026-01-18 00:00:00',2,'2026-01-18 17:36:57','2026-01-18 17:36:57'),(270,44,1,'salida','venta',113,NULL,113,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(271,4,1,'salida','venta',113,NULL,113,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(272,1,1,'salida','venta',113,NULL,113,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:38:26','2026-01-18 17:38:26'),(273,4,1,'salida','venta',114,NULL,114,NULL,NULL,2.00,'2026-01-18 00:00:00',2,'2026-01-18 17:39:44','2026-01-18 17:39:44'),(274,14,1,'salida','venta',114,NULL,114,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 17:39:45','2026-01-18 17:39:45'),(275,42,1,'salida','venta',115,NULL,115,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(276,9,1,'salida','venta',115,NULL,115,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(277,4,1,'salida','venta',115,NULL,115,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:12:42','2026-01-18 18:12:42'),(278,10,1,'salida','venta',116,NULL,116,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:22:16','2026-01-18 18:22:16'),(279,14,1,'salida','venta',116,NULL,116,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:22:16','2026-01-18 18:22:16'),(280,8,1,'salida','venta',117,NULL,117,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:28:35','2026-01-18 18:28:35'),(281,33,1,'salida','venta',117,NULL,117,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:28:35','2026-01-18 18:28:35'),(282,36,1,'salida','venta',118,NULL,118,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:33:57','2026-01-18 18:33:57'),(283,28,1,'salida','venta',118,NULL,118,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:33:57','2026-01-18 18:33:57'),(284,40,1,'salida','venta',118,NULL,118,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 18:33:57','2026-01-18 18:33:57'),(285,38,1,'salida','venta',119,NULL,119,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 19:38:40','2026-01-18 19:38:40'),(286,18,1,'salida','venta',119,NULL,119,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 19:38:40','2026-01-18 19:38:40'),(287,10,1,'salida','venta',120,NULL,120,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(288,39,1,'salida','venta',120,NULL,120,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(289,38,1,'salida','venta',120,NULL,120,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(290,17,1,'salida','venta',120,NULL,120,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:10:19','2026-01-18 21:10:19'),(291,16,1,'salida','venta',121,NULL,121,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:11:59','2026-01-18 21:11:59'),(292,6,1,'salida','venta',121,NULL,121,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:11:59','2026-01-18 21:11:59'),(293,3,1,'salida','venta',121,NULL,121,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:11:59','2026-01-18 21:11:59'),(294,36,1,'salida','venta',122,NULL,122,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:12:39','2026-01-18 21:12:39'),(295,42,1,'salida','venta',122,NULL,122,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:12:39','2026-01-18 21:12:39'),(296,44,1,'salida','venta',122,NULL,122,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:12:39','2026-01-18 21:12:39'),(297,29,1,'salida','venta',123,NULL,123,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:13:23','2026-01-18 21:13:23'),(298,39,1,'salida','venta',123,NULL,123,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:13:23','2026-01-18 21:13:23'),(299,35,1,'salida','venta',123,NULL,123,NULL,NULL,1.00,'2026-01-18 00:00:00',6,'2026-01-18 21:13:23','2026-01-18 21:13:23'),(300,32,1,'salida','venta',124,NULL,124,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(301,38,1,'salida','venta',124,NULL,124,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(302,2,1,'salida','venta',124,NULL,124,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(303,40,1,'salida','venta',124,NULL,124,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:19:21','2026-01-18 22:19:21'),(304,40,1,'salida','venta',125,NULL,125,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(305,41,1,'salida','venta',125,NULL,125,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(306,42,1,'salida','venta',125,NULL,125,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:20:37','2026-01-18 22:20:37'),(307,34,1,'salida','venta',126,NULL,126,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(308,9,1,'salida','venta',126,NULL,126,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(309,28,1,'salida','venta',126,NULL,126,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(310,11,1,'salida','venta',126,NULL,126,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:25:23','2026-01-18 22:25:23'),(311,36,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(312,42,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(313,44,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(314,9,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(315,38,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(316,35,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(317,30,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(318,33,1,'salida','venta',127,NULL,127,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-18 22:27:25','2026-01-18 22:27:25'),(319,44,1,'salida','venta',128,NULL,128,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(320,1,1,'salida','venta',128,NULL,128,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(321,39,1,'salida','venta',128,NULL,128,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-19 00:29:50','2026-01-19 00:29:50'),(322,44,1,'salida','venta',129,NULL,129,NULL,NULL,1.00,'2026-01-18 00:00:00',2,'2026-01-19 00:51:58','2026-01-19 00:51:58'),(323,44,1,'salida','venta',130,NULL,130,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:14:14','2026-01-19 14:14:14'),(324,42,1,'salida','venta',130,NULL,130,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:14:14','2026-01-19 14:14:14'),(325,9,1,'salida','venta',131,NULL,131,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:31:58','2026-01-19 14:31:58'),(326,11,1,'salida','venta',131,NULL,131,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:31:58','2026-01-19 14:31:58'),(327,34,1,'salida','venta',132,NULL,132,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:41:56','2026-01-19 14:41:56'),(328,9,1,'salida','venta',132,NULL,132,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:41:56','2026-01-19 14:41:56'),(329,44,1,'salida','venta',133,NULL,133,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:48:53','2026-01-19 14:48:53'),(330,41,1,'salida','venta',133,NULL,133,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 14:48:53','2026-01-19 14:48:53'),(331,44,1,'entrada','compra',27,NULL,NULL,NULL,NULL,10.00,'2026-01-19 00:00:00',6,'2026-01-19 15:41:02','2026-01-19 15:41:02'),(332,44,1,'salida','venta',134,NULL,134,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:45:30','2026-01-19 15:45:30'),(333,42,1,'salida','venta',134,NULL,134,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:45:30','2026-01-19 15:45:30'),(334,4,1,'salida','venta',135,NULL,135,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:47:15','2026-01-19 15:47:15'),(335,2,1,'salida','venta',135,NULL,135,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:47:15','2026-01-19 15:47:15'),(336,16,1,'salida','venta',135,NULL,135,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:47:15','2026-01-19 15:47:15'),(337,36,1,'salida','venta',136,NULL,136,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(338,9,1,'salida','venta',136,NULL,136,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(339,32,1,'salida','venta',136,NULL,136,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(340,10,1,'salida','venta',136,NULL,136,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 15:49:57','2026-01-19 15:49:57'),(341,44,1,'entrada','compra',28,NULL,NULL,NULL,NULL,10.00,'2026-01-19 00:00:00',6,'2026-01-19 16:29:47','2026-01-19 16:29:47'),(342,15,1,'salida','venta',137,NULL,137,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(343,4,1,'salida','venta',137,NULL,137,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(344,32,1,'salida','venta',137,NULL,137,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(345,28,1,'salida','venta',137,NULL,137,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:44:57','2026-01-19 16:44:57'),(346,4,1,'salida','venta',138,NULL,138,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:50:21','2026-01-19 16:50:21'),(347,34,1,'salida','venta',138,NULL,138,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:50:21','2026-01-19 16:50:21'),(348,9,1,'salida','venta',138,NULL,138,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 16:50:21','2026-01-19 16:50:21'),(349,4,1,'salida','venta',139,NULL,139,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 17:24:07','2026-01-19 17:24:07'),(350,34,1,'salida','venta',139,NULL,139,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 17:24:07','2026-01-19 17:24:07'),(351,9,1,'salida','venta',139,NULL,139,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 17:24:07','2026-01-19 17:24:07'),(352,15,1,'salida','venta',140,NULL,140,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 17:39:47','2026-01-19 17:39:47'),(353,44,1,'salida','venta',141,NULL,141,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 17:46:35','2026-01-19 17:46:35'),(354,28,1,'salida','venta',141,NULL,141,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 17:46:35','2026-01-19 17:46:35'),(355,15,1,'salida','venta',142,NULL,142,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:02:05','2026-01-19 18:02:05'),(356,32,1,'salida','venta',142,NULL,142,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:02:05','2026-01-19 18:02:05'),(357,15,1,'salida','venta',143,NULL,143,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:08:50','2026-01-19 18:08:50'),(358,32,1,'salida','venta',143,NULL,143,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:08:50','2026-01-19 18:08:50'),(359,4,1,'salida','venta',144,NULL,144,NULL,NULL,2.00,'2026-01-19 00:00:00',6,'2026-01-19 18:13:41','2026-01-19 18:13:41'),(360,44,1,'salida','venta',145,NULL,145,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(361,15,1,'salida','venta',145,NULL,145,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(362,10,1,'salida','venta',145,NULL,145,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:24:17','2026-01-19 18:24:17'),(363,32,1,'salida','venta',146,NULL,146,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:28:26','2026-01-19 18:28:26'),(364,36,1,'salida','venta',147,NULL,147,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:30:39','2026-01-19 18:30:39'),(365,30,1,'salida','venta',148,NULL,148,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 18:51:27','2026-01-19 18:51:27'),(366,42,1,'salida','venta',149,NULL,149,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(367,15,1,'salida','venta',149,NULL,149,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(368,11,1,'salida','venta',149,NULL,149,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(369,8,1,'salida','venta',149,NULL,149,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(370,24,1,'salida','venta',149,NULL,149,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:41:41','2026-01-19 19:41:41'),(371,27,1,'salida','venta',150,NULL,150,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:46:47','2026-01-19 19:46:47'),(372,40,1,'salida','venta',150,NULL,150,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 19:46:47','2026-01-19 19:46:47'),(373,4,1,'salida','venta',151,NULL,151,NULL,NULL,2.00,'2026-01-19 00:00:00',6,'2026-01-19 19:47:52','2026-01-19 19:47:52'),(374,4,1,'salida','venta',152,NULL,152,NULL,NULL,2.00,'2026-01-19 00:00:00',6,'2026-01-19 19:58:22','2026-01-19 19:58:22'),(375,36,1,'salida','venta',153,NULL,153,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(376,1,1,'salida','venta',153,NULL,153,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(377,7,1,'salida','venta',153,NULL,153,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(378,24,1,'salida','venta',153,NULL,153,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:38:03','2026-01-19 20:38:03'),(379,34,1,'salida','venta',154,NULL,154,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(380,9,1,'salida','venta',154,NULL,154,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(381,1,1,'salida','venta',154,NULL,154,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(382,2,1,'salida','venta',154,NULL,154,NULL,NULL,2.00,'2026-01-19 00:00:00',6,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(383,9,1,'salida','venta',154,NULL,154,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 20:39:44','2026-01-19 20:39:44'),(384,12,1,'salida','venta',155,NULL,155,NULL,NULL,250.00,'2026-01-19 00:00:00',6,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(385,13,1,'salida','venta',155,NULL,155,NULL,NULL,250.00,'2026-01-19 00:00:00',6,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(386,34,1,'salida','venta',155,NULL,155,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(387,9,1,'salida','venta',155,NULL,155,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(388,38,1,'salida','venta',155,NULL,155,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:37:38','2026-01-19 21:37:38'),(389,2,1,'salida','venta',156,NULL,156,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:39:37','2026-01-19 21:39:37'),(390,16,1,'salida','venta',156,NULL,156,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:39:37','2026-01-19 21:39:37'),(391,3,1,'salida','venta',156,NULL,156,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:39:37','2026-01-19 21:39:37'),(392,36,1,'salida','venta',157,NULL,157,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(393,42,1,'salida','venta',157,NULL,157,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(394,44,1,'salida','venta',157,NULL,157,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(395,10,1,'salida','venta',157,NULL,157,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 21:40:50','2026-01-19 21:40:50'),(396,4,1,'salida','venta',158,NULL,158,NULL,NULL,2.00,'2026-01-19 00:00:00',6,'2026-01-19 21:43:57','2026-01-19 21:43:57'),(397,5,1,'salida','venta',159,NULL,159,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(398,3,1,'salida','venta',159,NULL,159,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(399,18,1,'salida','venta',159,NULL,159,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:10:20','2026-01-19 22:10:20'),(400,36,1,'salida','venta',160,NULL,160,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(401,15,1,'salida','venta',160,NULL,160,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(402,9,1,'salida','venta',160,NULL,160,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(403,29,1,'salida','venta',160,NULL,160,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:12:53','2026-01-19 22:12:53'),(404,24,1,'salida','venta',161,NULL,161,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(405,38,1,'salida','venta',161,NULL,161,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(406,35,1,'salida','venta',161,NULL,161,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(407,33,1,'salida','venta',161,NULL,161,NULL,NULL,1.00,'2026-01-19 00:00:00',6,'2026-01-19 22:14:16','2026-01-19 22:14:16'),(408,45,1,'entrada','compra',29,NULL,NULL,NULL,NULL,50.00,'2026-01-19 00:00:00',6,'2026-01-19 22:24:31','2026-01-19 22:24:31'),(409,28,1,'entrada','compra',30,NULL,NULL,NULL,NULL,20.00,'2026-01-19 00:00:00',6,'2026-01-19 22:28:09','2026-01-19 22:28:09'),(410,1,1,'entrada','compra',31,NULL,NULL,NULL,NULL,20.00,'2026-01-19 00:00:00',6,'2026-01-19 22:30:41','2026-01-19 22:30:41');
/*!40000 ALTER TABLE `movimientos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `movimientos_billetera`
--

DROP TABLE IF EXISTS `movimientos_billetera`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `movimientos_billetera` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `cliente_id` bigint(20) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `tipo` enum('carga','consumo') NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `caja_id` int(11) NOT NULL,
  `usuario_id` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `movimientos_billetera`
--

LOCK TABLES `movimientos_billetera` WRITE;
/*!40000 ALTER TABLE `movimientos_billetera` DISABLE KEYS */;
INSERT INTO `movimientos_billetera` VALUES (1,5,1000.00,'carga','Carga de saldo',1,1,'2026-01-14 19:10:24'),(2,5,1000.00,'carga','Regalo cumpleaños',1,1,'2026-01-14 19:11:13'),(3,5,5000.00,'carga','Vuelto de Venta T-57',1,1,'2026-01-14 19:40:03'),(4,3,3000.00,'carga','Vuelto de Venta T-58',1,1,'2026-01-14 19:45:53'),(5,3,3000.00,'consumo','Pago de Venta T-60',1,1,'2026-01-14 19:53:16'),(6,5,2000.00,'consumo','Pago de Venta T-61',1,1,'2026-01-14 19:59:49'),(7,5,3000.00,'consumo','Pago de Venta T-62',1,1,'2026-01-14 20:52:31'),(8,5,7000.00,'carga','Vuelto de Venta T-62',1,1,'2026-01-14 20:52:31'),(9,5,5800.00,'consumo','Pago de Venta T-63',1,1,'2026-01-15 14:09:22'),(10,5,3200.00,'consumo','Pago de Venta T-75',1,1,'2026-01-16 19:47:29'),(11,2,10000.00,'carga','Agregado de saldo',1,1,'2026-01-16 23:16:52'),(12,2,5000.00,'consumo','Pago de Venta T-86',2,2,'2026-01-17 15:07:56'),(13,2,1000.00,'consumo','Pago de Venta T-128',2,2,'2026-01-19 00:29:50'),(14,2,1000.00,'consumo','Pago de Venta T-129',2,2,'2026-01-19 00:51:58'),(15,2,3000.00,'carga','Vuelto de Venta T-129',2,2,'2026-01-19 00:51:58'),(16,2,4000.00,'carga','Vuelto de Venta T-143',2,6,'2026-01-19 18:08:50'),(17,2,1000.00,'consumo','Pago de Venta T-144',2,6,'2026-01-19 18:13:41'),(18,2,4000.00,'carga','Vuelto de Venta T-144',2,6,'2026-01-19 18:13:41'),(19,6,3000.00,'carga','Vuelto de Venta T-145',2,6,'2026-01-19 18:24:17'),(20,5,2000.00,'carga','Vuelto de Venta T-146',2,6,'2026-01-19 18:28:27');
/*!40000 ALTER TABLE `movimientos_billetera` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ordenes_compra`
--

DROP TABLE IF EXISTS `ordenes_compra`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ordenes_compra` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `usuario_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `estado` enum('Pendiente','Recibida','Cancelada') DEFAULT 'Pendiente',
  `total_estimado` decimal(18,2) DEFAULT 0.00,
  `observaciones` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ordenes_compra`
--

LOCK TABLES `ordenes_compra` WRITE;
/*!40000 ALTER TABLE `ordenes_compra` DISABLE KEYS */;
INSERT INTO `ordenes_compra` VALUES (1,'2026-01-16',19,1,1,'Recibida',12000.00,'Entrega por la mañana','2026-01-16 02:56:30','2026-01-16 03:43:03'),(2,'2026-01-16',18,1,1,'Recibida',12000.00,'Entrega de mañana','2026-01-16 03:37:02','2026-01-16 13:23:39'),(3,'2026-01-17',15,2,1,'Recibida',105000.00,'','2026-01-17 17:11:46','2026-01-17 17:12:16'),(4,'2026-01-17',8,2,1,'Recibida',180000.00,'','2026-01-17 19:35:41','2026-01-17 19:35:55'),(5,'2026-01-17',18,2,1,'Recibida',40000.00,'','2026-01-17 22:23:49','2026-01-17 22:24:01'),(6,'2026-01-17',23,2,1,'Recibida',110000.00,'','2026-01-18 00:27:10','2026-01-18 00:27:19'),(7,'2026-01-17',24,2,1,'Recibida',32000.00,'','2026-01-18 02:52:48','2026-01-18 02:52:53'),(8,'2026-01-18',21,2,1,'Recibida',132500.00,'','2026-01-18 03:14:28','2026-01-18 03:14:35'),(9,'2026-01-18',22,2,1,'Recibida',93000.00,'','2026-01-18 03:28:10','2026-01-18 03:28:15'),(10,'2026-01-19',24,6,1,'Recibida',15000.00,'','2026-01-19 15:09:13','2026-01-19 15:17:11'),(11,'2026-01-19',22,6,1,'Recibida',15000.00,'','2026-01-19 16:28:22','2026-01-19 16:28:33'),(12,'2026-01-19',4,6,1,'Recibida',87500.00,'','2026-01-19 22:23:14','2026-01-19 22:23:21'),(13,'2026-01-19',22,6,1,'Recibida',22000.00,'','2026-01-19 22:26:47','2026-01-19 22:26:52'),(14,'2026-01-19',1,6,1,'Recibida',14000.00,'','2026-01-19 22:29:17','2026-01-19 22:29:23');
/*!40000 ALTER TABLE `ordenes_compra` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pago_compras`
--

DROP TABLE IF EXISTS `pago_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pago_compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `compra_id` bigint(20) unsigned NOT NULL,
  `proveedor_id` bigint(20) unsigned NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `monto` decimal(10,2) NOT NULL,
  `metodo_pago` varchar(255) NOT NULL,
  `fecha_pago` date NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pago_compras_compra_id_foreign` (`compra_id`),
  KEY `pago_compras_proveedor_id_foreign` (`proveedor_id`),
  KEY `pago_compras_empresa_id_foreign` (`empresa_id`),
  KEY `pago_compras_usuario_id_foreign` (`usuario_id`),
  CONSTRAINT `pago_compras_compra_id_foreign` FOREIGN KEY (`compra_id`) REFERENCES `compras` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pago_compras_empresa_id_foreign` FOREIGN KEY (`empresa_id`) REFERENCES `empresas` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pago_compras_proveedor_id_foreign` FOREIGN KEY (`proveedor_id`) REFERENCES `proveedors` (`id`) ON DELETE CASCADE,
  CONSTRAINT `pago_compras_usuario_id_foreign` FOREIGN KEY (`usuario_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pago_compras`
--

LOCK TABLES `pago_compras` WRITE;
/*!40000 ALTER TABLE `pago_compras` DISABLE KEYS */;
INSERT INTO `pago_compras` VALUES (1,1,4,1,1,1,5500.00,'efectivo','2026-01-12','2026-01-12 15:34:44','2026-01-12 15:34:44'),(2,20,8,1,1,2,162000.00,'banco','2026-01-18','2026-01-18 03:45:13','2026-01-18 03:45:13'),(3,14,9,1,1,2,15000.00,'banco','2026-01-18','2026-01-18 03:46:19','2026-01-18 03:46:19'),(4,19,15,1,1,2,105000.00,'banco','2026-01-18','2026-01-18 03:47:54','2026-01-18 03:47:54'),(5,22,22,1,1,2,20000.00,'efectivo','2026-01-18','2026-01-18 03:51:17','2026-01-18 03:51:17'),(6,24,22,1,1,2,15000.00,'efectivo','2026-01-18','2026-01-18 03:51:31','2026-01-18 03:51:31'),(7,7,19,1,1,2,2100.00,'efectivo','2026-01-18','2026-01-18 03:52:11','2026-01-18 03:52:11'),(8,11,19,1,1,2,23000.00,'efectivo','2026-01-18','2026-01-18 03:52:23','2026-01-18 03:52:23'),(9,21,23,1,1,6,110000.00,'banco','2026-01-18','2026-01-18 21:19:55','2026-01-18 21:19:55'),(10,23,24,1,1,6,32000.00,'banco','2026-01-18','2026-01-18 21:20:24','2026-01-18 21:20:24'),(11,25,21,1,1,6,132000.00,'banco','2026-01-18','2026-01-18 21:43:49','2026-01-18 21:43:49'),(12,25,21,1,1,6,500.00,'banco','2026-01-18','2026-01-18 21:45:14','2026-01-18 21:45:14'),(13,26,22,1,1,6,93000.00,'banco','2026-01-18','2026-01-18 21:46:53','2026-01-18 21:46:53'),(14,29,4,1,1,6,87500.00,'banco','2026-01-19','2026-01-19 22:24:31','2026-01-19 22:24:31'),(15,30,22,1,1,6,22000.00,'banco','2026-01-19','2026-01-19 22:28:09','2026-01-19 22:28:09'),(16,31,1,1,1,6,14000.00,'banco','2026-01-19','2026-01-19 22:30:41','2026-01-19 22:30:41');
/*!40000 ALTER TABLE `pago_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `pagos`
--

DROP TABLE IF EXISTS `pagos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `pagos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `venta_id` int(11) DEFAULT NULL,
  `cliente_id` bigint(20) unsigned NOT NULL,
  `compra_cta_cte_id` bigint(20) unsigned DEFAULT NULL,
  `monto` decimal(8,2) NOT NULL,
  `metodo_pago` varchar(255) NOT NULL,
  `fecha_pago` date NOT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `arqueo_id` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `pagos_venta_id_foreign` (`venta_id`),
  KEY `pagos_cliente_id_foreign` (`cliente_id`),
  KEY `pagos_compra_cta_cte_id_foreign` (`compra_cta_cte_id`),
  KEY `pagos_empresa_id_foreign` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `pagos`
--

LOCK TABLES `pagos` WRITE;
/*!40000 ALTER TABLE `pagos` DISABLE KEYS */;
INSERT INTO `pagos` VALUES (1,NULL,3,3,3000.00,'efectivo','2026-01-12','Pago de Cuenta Corriente',1,1,12,'2026-01-12 14:57:26',NULL),(2,NULL,5,4,2200.00,'efectivo','2026-01-12','Pago de Cuenta Corriente',1,2,14,'2026-01-12 19:13:43',NULL),(3,NULL,2,10,8700.00,'efectivo','2026-01-19','Pago de Cuenta Corriente',1,2,48,'2026-01-19 16:47:29',NULL);
/*!40000 ALTER TABLE `pagos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `permissions`
--

DROP TABLE IF EXISTS `permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `permissions` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `permissions_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `permissions`
--

LOCK TABLES `permissions` WRITE;
/*!40000 ALTER TABLE `permissions` DISABLE KEYS */;
INSERT INTO `permissions` VALUES (1,'ver_usuarios','0000-00-00 00:00:00',NULL),(2,'ver_roles',NULL,NULL),(3,'ver_permisos',NULL,NULL),(4,'ver_empresa',NULL,NULL),(5,'ver_categorias',NULL,NULL),(6,'ver_unidades',NULL,NULL),(7,'ver_productos',NULL,NULL),(8,'ver_proveedores',NULL,NULL),(9,'ver_compras',NULL,NULL),(10,'ver_clientes',NULL,NULL),(11,'ver_ventas',NULL,NULL),(12,'ver_arqueos',NULL,NULL),(13,'ver_combos',NULL,NULL),(14,'ver_devoluciones',NULL,NULL),(15,'ver_configuracion',NULL,NULL),(16,'ver_ajustes',NULL,NULL),(17,'ver_movimientos',NULL,NULL),(18,'ver_gastos',NULL,NULL),(19,'ver_logs',NULL,NULL);
/*!40000 ALTER TABLE `permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `productos`
--

DROP TABLE IF EXISTS `productos`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `productos` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `codigo` varchar(255) NOT NULL,
  `nombre` varchar(255) NOT NULL,
  `nombre_corto` varchar(255) DEFAULT NULL,
  `descripcion` text DEFAULT NULL,
  `imagen` text DEFAULT NULL,
  `stock` int(11) NOT NULL,
  `stock_minimo` int(11) NOT NULL,
  `stock_maximo` int(11) NOT NULL,
  `precio_compra` decimal(8,2) NOT NULL,
  `precio_venta` decimal(8,2) NOT NULL DEFAULT 0.00,
  `aplicar_porcentaje` tinyint(1) NOT NULL DEFAULT 0,
  `valor_porcentaje` decimal(5,2) DEFAULT 0.00,
  `fecha_ingreso` date NOT NULL,
  `categoria_id` bigint(20) unsigned NOT NULL,
  `unidad_id` bigint(20) unsigned DEFAULT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `productos_codigo_unique` (`codigo`),
  KEY `productos_categoria_id_foreign` (`categoria_id`),
  KEY `unidad_id` (`unidad_id`),
  CONSTRAINT `productos_categoria_id_foreign` FOREIGN KEY (`categoria_id`) REFERENCES `categorias` (`id`) ON DELETE CASCADE,
  CONSTRAINT `productos_ibfk_1` FOREIGN KEY (`unidad_id`) REFERENCES `unidads` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `productos`
--

LOCK TABLES `productos` WRITE;
/*!40000 ALTER TABLE `productos` DISABLE KEYS */;
INSERT INTO `productos` VALUES (1,'7790070336217','Fideos Mostachol N°52 Matarazzo 500g','FIDEOS MOSTACHOL 52 MATA','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071765/productos_sistema_ventas/avinjbfq88ca5bcbwwxd.jpg',40,20,10000,700.00,1400.00,1,100.00,'2025-03-03',3,1,1,'2025-03-03 19:26:32','2026-01-19 22:30:41'),(2,'7790040139657','Merengadas Bagley 88g','MERENGADAS.BAGLEY','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072277/productos_sistema_ventas/wistkxrz3a5kisagproi.jpg',88,20,1000,1100.00,2200.00,1,100.00,'2025-03-03',4,1,1,'2025-03-03 20:20:59','2026-01-19 21:39:37'),(3,'7790040677005','Tortitas sabor chocolate Arcor 152g','ARCOR TORTITAS CHO','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072846/productos_sistema_ventas/qc2awhzz9x2pqslicaie.jpg',33,20,1000,1500.00,3000.00,1,100.00,'2025-03-03',4,1,1,'2025-03-03 20:22:36','2026-01-19 22:10:20'),(4,'7790895000218','Coca Cola 2L Env. Retornable','COCA COLA ENV. RET','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071199/productos_sistema_ventas/phdk4g0ordkbwa7lwazr.png',39,10,10000,1750.00,3500.00,1,100.00,'2025-03-03',1,1,1,'2025-03-03 21:45:31','2026-01-19 21:43:57'),(5,'7791270336998','Vino Luigi Bosca - Tinto - Malbec - 750ml','VINO LUIGI TITNO MALBEC','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072906/productos_sistema_ventas/i3adqcg3hzx1wm1laukf.jpg',6,5,100,9600.00,14400.00,1,50.00,'2025-03-03',2,1,1,'2025-03-03 21:57:38','2026-01-19 22:10:20'),(6,'7798132920848','Tomate Perita Clasico - Canale 400g','LATA PERITA CANALE 400G','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072802/productos_sistema_ventas/ivspqw7aloazy5b5ex3g.jpg',32,10,500,800.00,1600.00,1,100.00,'2025-03-04',5,1,1,'2025-03-04 14:23:23','2026-01-18 21:11:59'),(7,'7798177401296','Galletitas Saladas con Queso Talitas Urquiza','URQUIZA/CINDA.QUESO','Talitas con Queso','https://res.cloudinary.com/draucg1h5/image/upload/v1768071963/productos_sistema_ventas/jmb54mywdnllwwf4f31l.jpg',34,10,10000,1100.00,3300.00,1,200.00,'2025-03-03',4,1,1,'2025-03-25 16:31:45','2026-01-19 20:38:03'),(8,'7798177401449','Galletitas Sabor Cheddar Talitas Urquiza','URQUIZA/CINDA.CHED','Talitas Cheddar','https://res.cloudinary.com/draucg1h5/image/upload/v1768071914/productos_sistema_ventas/jzgwjcifxiuvuntbb9pn.jpg',46,10,10000,1200.00,2400.00,1,100.00,'2025-03-05',4,1,1,'2025-03-26 13:35:35','2026-01-19 19:41:41'),(9,'7613034449993','Chocolate en Polvo Nesquik 360g Nestle','NESQUIK NESTLE 360G','Chocolate en Polvo','https://res.cloudinary.com/draucg1h5/image/upload/v1768071122/productos_sistema_ventas/pb6w2nqptexmalxqwhez.jpg',79,10,10000,1800.00,3600.00,1,100.00,'2025-03-05',6,1,1,'2025-03-26 13:48:00','2026-01-19 22:12:53'),(10,'7790070336200','Fideos Penne Rigate N°48 Matarazzo 500g','FIDEOS PENNE RIGATE MATA','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071852/productos_sistema_ventas/xx6vaiu5fv3asnnzhtop.jpg',15,10,10000,600.00,1200.00,1,100.00,'2025-03-06',3,1,1,'2025-03-27 21:49:16','2026-01-19 21:40:50'),(11,'7790070320032','Fideos Municiones Matarazzo 500g','FIDEOS MUNICIONES MATA','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071808/productos_sistema_ventas/llqh1kjkxdd4ukjkn6iu.jpg',25,10,10000,950.00,1900.00,1,100.00,'2025-03-06',3,1,1,'2025-03-27 23:47:12','2026-01-19 19:41:41'),(12,'7899674034000','Jamon Cocido Calchaqui','JAMON COCIDO CALCHAQUI','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072019/productos_sistema_ventas/oedhq2ivherqnbzx01qu.jpg',250,1000,100000,5.80,11.60,1,100.00,'2025-03-20',7,3,1,'2025-03-30 16:07:32','2026-01-19 21:37:38'),(13,'7899674034001','Queso de Barra Calchaqui','QUESO BARRA CALCHAQUI','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072491/productos_sistema_ventas/yuiylmlz1ayxicvv6jl2.jpg',250,1000,100000,5.80,11.60,1,100.00,'2025-03-20',7,3,1,'2025-03-30 16:10:34','2026-01-19 21:37:38'),(14,'7793890258752','Lactal - Pan de Mesa - 460g. Fargo','LACTAL/PAN MESA','Pan lactal en paquete naylon','https://res.cloudinary.com/draucg1h5/image/upload/v1768072133/productos_sistema_ventas/ft2wmmpzihktyiebsd4g.jpg',20,10,100,1750.00,3500.00,1,100.00,'2025-03-20',8,1,1,'2025-03-30 16:15:52','2026-01-18 18:22:16'),(15,'7790070562074','Chipá tipo caseros Lucchetti 400g','CHIPA LUCCHETTI 400G','','https://res.cloudinary.com/draucg1h5/image/upload/v1768069377/productos_sistema_ventas/hgm9bg7xdnehwprxfucm.jpg',23,10,100,1500.00,3000.00,1,100.00,'2025-03-20',6,1,1,'2025-03-30 16:21:43','2026-01-19 22:12:53'),(16,'7798113301529','Soda Manaos 2L','SODA/MANAOS','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072748/productos_sistema_ventas/xsebvbddkynzvipxuydi.jpg',23,10,1000,750.00,1500.00,1,100.00,'2025-03-31',1,1,1,'2025-03-31 13:48:11','2026-01-19 21:39:37'),(17,'7795265005114','Mini Alfaj. R.  Maicena - Cabo Blanco 145gr.','CABO BLANCO MAICEN','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072370/productos_sistema_ventas/rcqzrwmq07jjprplw9p8.jpg',25,10,100,1500.00,3000.00,1,100.00,'2025-03-31',4,1,1,'2025-03-31 14:49:58','2026-01-18 21:10:19'),(18,'7794000006379','Puré de Papas R. Completa - Knorr 125gr.','KNORR/PU.PAP.COMP','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072424/productos_sistema_ventas/xvpkelwxliq5xzlmxl54.jpg',22,10,100,1350.00,2700.00,1,100.00,'2025-03-31',6,1,1,'2025-03-31 14:54:47','2026-01-19 22:10:20'),(19,'7790040139091','Merengadas Pack Bagley 264g','MERENGADAS PACK','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072321/productos_sistema_ventas/mmujtzvwh4wputwnzmbm.jpg',25,10,100,2600.00,5200.00,1,100.00,'2025-04-08',4,1,1,'2025-04-08 14:31:11','2026-01-16 23:21:22'),(20,'7790070507372','Jugo 100% Limon Minerva','MINERVA LIMON','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072068/productos_sistema_ventas/dtogotxyv9qxbzdvabji.jpg',28,10,100,2300.00,4600.00,1,100.00,'2025-04-08',1,1,1,'2025-04-08 14:38:58','2026-01-17 22:21:05'),(21,'7790742223005','Queso Rallado Reggianito La Serenisima 70g','QUESO RALLADO SERE','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072648/productos_sistema_ventas/glw8xypsqaucp0wit1nl.jpg',47,10,100,1300.00,2600.00,1,100.00,'2025-04-08',9,1,1,'2025-04-08 14:51:02','2026-01-11 20:22:08'),(22,'7790742223203','Queso Rallado Reggianito La Serenisima 175g','SERE/QUESO.RALLADO','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072554/productos_sistema_ventas/mttbdszkcqovolhx7kqd.jpg',12,10,100,3350.00,6700.00,1,100.00,'2025-04-08',9,1,1,'2025-04-08 14:53:07','2026-01-16 18:25:44'),(23,'7790742222909','Queso Rallado Reggianito La Serenisima 35g','SERE/QUESO.RALLA35','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072600/productos_sistema_ventas/hxlul3ugwr7xjtho3ns5.jpg',45,10,100,600.00,1200.00,1,100.00,'2025-04-10',9,1,1,'2025-04-10 12:21:52','2026-01-14 16:19:26'),(24,'7790903001374','Lactal - Pan de Mesa - 550g. La Perla','LA PERLA/PAN TRADI','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072181/productos_sistema_ventas/nvjt5rawpsckcb5m1a8f.jpg',32,10,100,1650.00,3300.00,1,100.00,'2025-04-14',8,1,1,'2025-04-15 00:28:39','2026-01-19 22:14:16'),(27,'7798149754221','Repelente de Insectos spray 200 ml','REPEL-INSECT-SP-200','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072703/productos_sistema_ventas/qmgzmzm9xhpfifahgueh.jpg',26,10,100,1200.00,2400.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 17:08:53','2026-01-19 19:46:47'),(28,'7791293048031','Desodorante Dove Meb + care 150 ml','DESO-DOVE-CARE-150','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071689/productos_sistema_ventas/vjkculu5nhvvo8hmoqdj.jpg',30,10,100,1100.00,2200.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 18:50:33','2026-01-19 22:28:09'),(29,'7501054550563','Curitas Transpiel 40','CURITA-TRANS-40','','https://res.cloudinary.com/draucg1h5/image/upload/v1768071619/productos_sistema_ventas/e7f7yjvg1k7zactj9teg.jpg',12,10,100,500.00,1000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-19 22:12:53'),(30,'7790520014214','Lysoform Desinfectante 360 cm3','LYSO-DESIN-360','','https://res.cloudinary.com/draucg1h5/image/upload/v1768072224/productos_sistema_ventas/mvaip4ykbk4c6utnqaum.jpg',12,10,100,1500.00,3000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-19 18:51:27'),(31,'7791600065478','Caro Cuore Desodorante 123 ml','CARO-CUORE-123','','https://res.cloudinary.com/draucg1h5/image/upload/v1768069211/productos_sistema_ventas/ontlzcxg7icglndh5bz1.jpg',11,10,100,2000.00,4000.00,1,100.00,'2025-12-28',10,1,1,'2025-12-28 19:19:57','2026-01-15 14:50:39'),(32,'77980755','Crema Repelente de Insectos OFF Family 60g','OFF-CREAMA-60','Crema Repelente de Insectos','https://res.cloudinary.com/draucg1h5/image/upload/v1768071261/productos_sistema_ventas/fsfezgp8shie3hgm2npu.jpg',19,10,100,1500.00,3000.00,1,100.00,'2026-01-06',14,1,1,'2026-01-06 10:41:33','2026-01-19 18:28:26'),(33,'7790520025746','Mata Hormigas Raid Max 360cm3','RAID-MAT-HORM','Mata Hormigas Raid Max 360cm3','https://res.cloudinary.com/draucg1h5/image/upload/v1768073375/productos_sistema_ventas/n7wgwmigyxbw1cppsgj7.jpg',31,10,100,2300.00,4600.00,1,100.00,'2026-01-10',10,1,1,'2026-01-10 19:28:18','2026-01-19 22:14:16'),(34,'7790742363008','Leche Larga Vida Clasica La Serenisima','LECHE-LARGA-VC-LASERE','Leche Larga Vida Clasica La Serenisima 1L','https://res.cloudinary.com/draucg1h5/image/upload/v1768668656/productos_sistema_ventas/wug5hro27bmx6foxlfa4.jpg',31,10,100,1050.00,2100.00,1,100.00,'2026-01-17',9,1,1,'2026-01-17 16:50:56','2026-01-19 21:37:38'),(35,'7790742363107','Lecha Larga Vida Liviana La Serenisima','LECHE-LARGA-VL-LASERE','Lecha Larga Vida Liviana La Serenisima 1L','https://res.cloudinary.com/draucg1h5/image/upload/v1768668909/productos_sistema_ventas/tiohqukru2nbsxs8leyu.jpg',46,10,100,1050.00,2100.00,1,100.00,'2026-01-17',9,1,1,'2026-01-17 16:55:10','2026-01-19 22:14:16'),(36,'7790009530563','Bolsa de consorcio Cultura en Limpieza 90x120','BOL-CONS-90x120','Bolsa de consorcio Cultura en Limpieza 90x120','https://res.cloudinary.com/draucg1h5/image/upload/v1768691682/productos_sistema_ventas/ssd20aot6xl1hgi25uc5.jpg',41,10,100,1500.00,3000.00,1,100.00,'2026-01-17',15,1,1,'2026-01-17 23:14:43','2026-01-19 22:12:53'),(37,'7790109430480','Bolsas de Consorcio Cultura en Limpieza 80x110','BOL-CONS-80x110','Bolsas de Consorcio Cultura en Limpieza 80x110','https://res.cloudinary.com/draucg1h5/image/upload/v1768691958/productos_sistema_ventas/d3ajumldctq3ozcoxqga.jpg',50,10,100,1150.00,2300.00,1,100.00,'2026-01-17',15,1,1,'2026-01-17 23:19:18','2026-01-18 03:15:46'),(38,'7793253003715','Lavandina Ayudin Lavanda 1L','LAVANDINA-AYUDIN-LAV','Lavandina Ayudin Lavanda 1 litro','https://res.cloudinary.com/draucg1h5/image/upload/v1768692145/productos_sistema_ventas/frghxs0xwagiatdjpedk.jpg',21,10,100,1100.00,2200.00,1,100.00,'2026-01-17',15,1,1,'2026-01-17 23:22:25','2026-01-19 22:14:16'),(39,'7790580602000','Gomitas Mogul Frutales Arcor','GOMITAS-MOGUL','Gomitas Mogul Frutales Arcor','https://res.cloudinary.com/draucg1h5/image/upload/v1768692411/productos_sistema_ventas/saee46rqgsherpibrbic.jpg',23,10,100,600.00,1200.00,1,100.00,'2026-01-17',16,1,1,'2026-01-17 23:26:51','2026-01-19 00:29:50'),(40,'7790580421007','Rocklets Arcor 20g','ROCKLETS20','Rocklets Arcor 20 Gramos','https://res.cloudinary.com/draucg1h5/image/upload/v1768692643/productos_sistema_ventas/jeebefznkwowhe3qj2iv.jpg',25,10,100,800.00,1600.00,1,100.00,'2026-01-17',16,1,1,'2026-01-17 23:30:43','2026-01-19 19:46:47'),(41,'7798054220156','Pepas Membrillo Tereppín Emery 200g','PEPASTERE200','Pepas Membrillo Tereppín Emery 200g','https://res.cloudinary.com/draucg1h5/image/upload/v1768692931/productos_sistema_ventas/f1loihwqmbv1kittok1k.jpg',25,10,100,600.00,1200.00,1,100.00,'2026-01-17',4,1,1,'2026-01-17 23:35:32','2026-01-19 14:48:53'),(42,'7798094222318','Budin Chocolate Fantasía Nevares 180g','BUDIN-CHOCO-NEVARES','Budin Chocolate Fantasía Nevares 180g','https://res.cloudinary.com/draucg1h5/image/upload/v1768693166/productos_sistema_ventas/jrkxaek0fewrsmhpc4ga.jpg',51,10,100,1000.00,2000.00,1,100.00,'2026-01-17',6,1,1,'2026-01-17 23:39:26','2026-01-19 21:40:50'),(43,'7798094222325','Budin Limon Fantasía Nevares 180g','BUDIN-LIMON-NEVARES','Budin Limon Fantasía Nevares 180g','https://res.cloudinary.com/draucg1h5/image/upload/v1768693380/productos_sistema_ventas/rbnlzostebcdw4pqswes.jpg',60,10,100,1000.00,2000.00,1,100.00,'2026-01-17',6,1,1,'2026-01-17 23:43:00','2026-01-18 00:31:27'),(44,'8445291082199','Cafe Dolca Original Nescafe 100g','CAFE-DOLCA-100','Cafe Dolca Original Nescafe 100g','https://res.cloudinary.com/draucg1h5/image/upload/v1768693589/productos_sistema_ventas/ml0ulcelrv3gvvryijdw.jpg',38,10,100,1400.00,2800.00,1,100.00,'2026-01-17',6,1,1,'2026-01-17 23:46:29','2026-01-19 21:40:50'),(45,'7790895000225','Sprite 2L Env. Retornable','SPRITE2LRET','Sprite 2 Litros Envase Retornable','https://res.cloudinary.com/draucg1h5/image/upload/v1768861249/productos_sistema_ventas/xdvuxtvprq6kdkobdnxr.jpg',50,10,100,1750.00,3500.00,1,100.00,'2026-01-19',1,1,1,'2026-01-19 22:20:50','2026-01-19 22:24:31');
/*!40000 ALTER TABLE `productos` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `promociones`
--

DROP TABLE IF EXISTS `promociones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `promociones` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `empresa_id` int(11) NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `nombre_promo` varchar(100) DEFAULT NULL,
  `tipo` enum('3x2','2da_al_70','2da_al_50','4x3') NOT NULL,
  `estado` tinyint(1) DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `promociones`
--

LOCK TABLES `promociones` WRITE;
/*!40000 ALTER TABLE `promociones` DISABLE KEYS */;
INSERT INTO `promociones` VALUES (1,1,9,'Oferta Miercoles','3x2',1,'2026-01-13 01:34:21');
/*!40000 ALTER TABLE `promociones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `proveedors`
--

DROP TABLE IF EXISTS `proveedors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `proveedors` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `empresa` varchar(255) NOT NULL,
  `marca` varchar(255) DEFAULT NULL,
  `direccion` varchar(255) NOT NULL,
  `telefono` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `contacto` varchar(255) NOT NULL,
  `celular` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `proveedors`
--

LOCK TABLES `proveedors` WRITE;
/*!40000 ALTER TABLE `proveedors` DISABLE KEYS */;
INSERT INTO `proveedors` VALUES (1,'Matarazzo Hnos.','Matarazzo','Rivadavia 1752 - CABA','1122556688','matarazzo@gmail.com','Juan Ernesto Sabato','1122558877',1,'2025-03-03 22:30:45','2025-03-03 22:30:45'),(2,'Arcor Hnos.','Arcor','Guaemes 2754 - CABA','11447744','arcor@gmail.com','Pedro Scaloni','11447788',1,'2025-03-03 23:25:31','2025-03-03 23:25:31'),(3,'Bagley S.A.','Bagley','Moreno 741 - CABA','11336699','bagley@gmail.com','Alicia Ferraro','11887755',1,'2025-03-03 23:26:43','2025-03-03 23:26:43'),(4,'Coca Cola - FEMESA','Coca Cola','Amancio Alcorta 3570 - Pompeya','1146308999','cocacola@gmail.com','Juan Agustin Garcia','1138669097',1,'2025-03-04 00:41:29','2025-03-04 00:41:29'),(5,'Capri Distribuidora SRL','Capri','Luis Braille 5655 - CABA','1131758262','capri@gmail.com','Pepe Argento','1155778955',1,'2025-03-04 00:52:15','2025-03-04 00:52:15'),(6,'Canale S.A.','Canale','Gaona 1258','1122558877','canale@gmail.com','Hernan de la Serna','1155447788',1,'2025-03-04 17:25:14','2025-03-04 17:25:14'),(7,'Urquiza Panificados S.R.L.','Urquiza','1° de Agosto 5817, Villa Ballester','1145893298','ventas@brurin.com.ar','Walter Giardino','1122558745',1,'2025-03-25 19:34:39','2025-03-25 19:34:39'),(8,'Nestle Argentina S.A.','Nestle','Carlos Pellegrini 887 - CABA','1156568687','nestle@gmail.com','Alicia Mendez','1135784566',1,'2025-03-26 16:53:17','2025-03-26 16:53:17'),(9,'Molinos Rio de la Plata S.A.','Molinos','Ruta de la tradicción 3500 - 9 de abril - Bs. As.','08005554321','contacto@molinos.com.ar','Patricia Altamirano','1157856397',1,'2025-03-30 19:25:37','2025-03-30 19:25:37'),(10,'Compañia de Alimentos Fargo S.A.','Fargo','Av. Corrientes 330, Piso 6, Oficina 612, CABA','08001220240','fargo@gmail.com','Ernesto Piparo','1122486697',1,'2025-03-30 19:28:46','2025-03-30 19:28:46'),(11,'Fiambres Calchaqui S.R.L.','Calchaqui','El Arreo 220','1138669097','calchaqui@gmail.com','Pepe Parada','1138669097',1,'2025-03-30 19:35:53','2026-01-16 15:36:40'),(12,'Refres Now S.A.','Manaos','Brig. Juan Manuel de Rosas 25160 - Virrey del Pino - La Matanza','1156998721','manaos@gmail.com','Julian Alvarez','1154774556',1,'2025-03-31 16:53:04','2025-03-31 16:53:04'),(13,'Cabo Blanco Total S.A.','Cabo Blanco','Gran Piran 852, Aldo Bonzi, La Matanza','1144789554','caboblanco@gmail.com','Enzo Fernandez','1199877472',1,'2025-03-31 17:59:19','2025-03-31 17:59:19'),(14,'Unilever de Argentina S.A.','Knorr','Alf. H. Bouchard 4191 - Munro - Vicente Lopez','080088886436','knorr@gmail.com','Calitos Tevez','1132445752',1,'2025-03-31 18:03:47','2025-03-31 18:03:47'),(15,'Mastellone San Luis S.A.','La Serenisima','Ruta Prov. N° 2 B Km 1,5, Villa Mercedes. San Luis','08005553243','laserenisima@gmail.com','Pedro Parada','1155875632',1,'2025-04-08 17:56:10','2025-04-08 18:01:00'),(16,'La Perla S.A.','La Perla','Juan Austin Garcia 2752 6 A','1138661609','nataliaoduber@gmail.com','Pedro Parada','1155875632',1,'2025-04-15 03:30:52','2025-04-15 03:30:52'),(17,'Sideral SRL','Kevin','Juan de los palotes 1231 - Uruguay','1136998877','sideral@gmail.com','Pedro Aznar','1122547899',1,'2025-12-28 22:00:40','2025-12-28 22:08:00'),(18,'Cuidado Personal SRL','OFF','Juan Agustin Garcia 6 A','1138669097','cuidado@gmail.com','Alicia Ferraro','1155875632',1,'2026-01-06 11:20:23','2026-01-06 11:20:23'),(19,'Minerva Srl','Minerva','Juan Agustin Garcia 6 A','1138669097','minerva@gmail.com','Pedro Parada','1138669097',1,'2026-01-14 21:53:19','2026-01-14 21:53:19'),(20,'Proveedor Bebidas General','Coca Cola','Juan Agustin Garcia 6 A','1138669097','bebidas@gmail.com','Alicia Ferraro','1138669097',1,'2026-01-17 01:04:37','2026-01-17 01:04:37'),(21,'Cultura en Limpieza SRL','Cultura en Limpieza','Carlos Pellegrini 887 - CABA','1138669097','cultura@gmail.com','Pepe Parada','1138669097',1,'2026-01-18 00:20:38','2026-01-18 00:20:38'),(22,'Maxiconsumo Mayorista S.A.','Varias','Coletora 1254 - La Reja','1138669097','maxiconsumo@gmail.com','Karina Gonzalez','1138669097',1,'2026-01-18 00:23:29','2026-01-18 00:23:29'),(23,'Nevares S.A.','Nevares','Juan Agustin Garcia 6 A','1138669097','nevares@gmail.com','Pedro Scaloni','1138669097',1,'2026-01-18 00:24:26','2026-01-18 00:24:26'),(24,'Nescafe S.A.','Dolca','Juan Agustin Garcia 6 A','1138669097','nescafe@gmail.com','Pedro Aznar','1138669097',1,'2026-01-18 02:51:17','2026-01-18 02:51:33');
/*!40000 ALTER TABLE `proveedors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `retiros_caja`
--

DROP TABLE IF EXISTS `retiros_caja`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `retiros_caja` (
  `id` bigint(20) NOT NULL AUTO_INCREMENT,
  `arqueo_id` bigint(20) NOT NULL,
  `monto` decimal(12,2) NOT NULL,
  `motivo` varchar(255) DEFAULT 'Retiro de seguridad',
  `usuario_id` int(11) NOT NULL,
  `caja_id` int(11) NOT NULL,
  `fecha` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `retiros_caja`
--

LOCK TABLES `retiros_caja` WRITE;
/*!40000 ALTER TABLE `retiros_caja` DISABLE KEYS */;
INSERT INTO `retiros_caja` VALUES (1,16,10000.00,'Retiro por seguridad',1,1,'2026-01-13 21:28:40'),(2,17,5000.00,'Retiro dueño',1,1,'2026-01-13 22:14:46'),(3,18,5000.00,'Retiro dueño',1,1,'2026-01-14 14:22:57'),(4,19,5000.00,'Retiro dueño',1,1,'2026-01-14 14:47:45'),(5,20,5000.00,'Retiro dueño',1,1,'2026-01-14 14:54:04'),(6,24,5000.00,'Retiro de seguridad',1,1,'2026-01-14 16:25:35'),(7,48,10000.00,'Retiro dueño',6,2,'2026-01-19 22:47:31');
/*!40000 ALTER TABLE `retiros_caja` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `role_has_permissions`
--

DROP TABLE IF EXISTS `role_has_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `role_has_permissions` (
  `permission_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`permission_id`,`role_id`),
  KEY `role_has_permissions_role_id_foreign` (`role_id`),
  CONSTRAINT `role_has_permissions_permission_id_foreign` FOREIGN KEY (`permission_id`) REFERENCES `permissions` (`id`) ON DELETE CASCADE,
  CONSTRAINT `role_has_permissions_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `role_has_permissions`
--

LOCK TABLES `role_has_permissions` WRITE;
/*!40000 ALTER TABLE `role_has_permissions` DISABLE KEYS */;
INSERT INTO `role_has_permissions` VALUES (1,1),(1,2),(2,1),(2,2),(3,1),(3,2),(4,1),(4,2),(5,1),(5,2),(6,1),(6,2),(7,1),(7,2),(8,1),(8,2),(9,1),(9,2),(10,1),(10,2),(11,1),(11,2),(12,1),(12,2),(13,1),(13,2),(14,1),(14,2),(15,1),(15,2),(16,1),(16,2),(17,1),(17,2),(18,1),(18,2),(19,1),(19,2);
/*!40000 ALTER TABLE `role_has_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `roles`
--

DROP TABLE IF EXISTS `roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `roles` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `roles_name_unique` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `roles`
--

LOCK TABLES `roles` WRITE;
/*!40000 ALTER TABLE `roles` DISABLE KEYS */;
INSERT INTO `roles` VALUES (1,'Administrador',NULL,NULL),(2,'Cajero/a',NULL,NULL),(3,'Compras',NULL,NULL),(4,'Deposito',NULL,NULL),(5,'Vigilancia',NULL,NULL);
/*!40000 ALTER TABLE `roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sistema_licencia`
--

DROP TABLE IF EXISTS `sistema_licencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sistema_licencia` (
  `id` int(11) NOT NULL DEFAULT 1,
  `serial_autorizado` varchar(255) NOT NULL,
  `cliente_nombre` varchar(255) DEFAULT NULL,
  `fecha_activacion` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_spanish_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sistema_licencia`
--

LOCK TABLES `sistema_licencia` WRITE;
/*!40000 ALTER TABLE `sistema_licencia` DISABLE KEYS */;
INSERT INTO `sistema_licencia` VALUES (1,'ZN1C3SFY','Cliente Morrone','2026-01-17 05:33:03');
/*!40000 ALTER TABLE `sistema_licencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tmp_compras`
--

DROP TABLE IF EXISTS `tmp_compras`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmp_compras` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `precio_compra` decimal(12,2) DEFAULT 0.00,
  `precio_anterior` decimal(18,2) DEFAULT 0.00,
  `mejor_precio` decimal(18,2) DEFAULT 0.00,
  `mejor_proveedor` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tmp_compras_producto_id_foreign` (`producto_id`),
  CONSTRAINT `tmp_compras_producto_id_foreign` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=58 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tmp_compras`
--

LOCK TABLES `tmp_compras` WRITE;
/*!40000 ALTER TABLE `tmp_compras` DISABLE KEYS */;
/*!40000 ALTER TABLE `tmp_compras` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tmp_devoluciones`
--

DROP TABLE IF EXISTS `tmp_devoluciones`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmp_devoluciones` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tmp_devoluciones_producto_id_foreign` (`producto_id`),
  KEY `tmp_devoluciones_combo_id_foreign` (`combo_id`),
  CONSTRAINT `fk_tmp_devoluciones_combos` FOREIGN KEY (`combo_id`) REFERENCES `combos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_tmp_devoluciones_productos` FOREIGN KEY (`producto_id`) REFERENCES `productos` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tmp_devoluciones`
--

LOCK TABLES `tmp_devoluciones` WRITE;
/*!40000 ALTER TABLE `tmp_devoluciones` DISABLE KEYS */;
/*!40000 ALTER TABLE `tmp_devoluciones` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tmp_ventas`
--

DROP TABLE IF EXISTS `tmp_ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tmp_ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `cantidad` int(11) NOT NULL,
  `session_id` varchar(255) NOT NULL,
  `producto_id` bigint(20) unsigned DEFAULT NULL,
  `combo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `tmp_ventas_producto_id_foreign` (`producto_id`),
  KEY `tmp_ventas_combo_id_foreign` (`combo_id`)
) ENGINE=InnoDB AUTO_INCREMENT=409 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tmp_ventas`
--

LOCK TABLES `tmp_ventas` WRITE;
/*!40000 ALTER TABLE `tmp_ventas` DISABLE KEYS */;
/*!40000 ALTER TABLE `tmp_ventas` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `unidads`
--

DROP TABLE IF EXISTS `unidads`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unidads` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `nombre` varchar(255) NOT NULL,
  `descripcion` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unidads_nombre_unique` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `unidads`
--

LOCK TABLES `unidads` WRITE;
/*!40000 ALTER TABLE `unidads` DISABLE KEYS */;
INSERT INTO `unidads` VALUES (1,'Unidad','Unitario',1,'2025-03-28 22:20:25','2025-03-28 22:20:25'),(2,'Kilogramos','Kilogramos',1,'2025-03-28 22:20:53','2025-04-04 18:07:20'),(3,'Gramos','Gramos',1,'2025-03-28 22:21:31','2025-04-04 18:07:04'),(4,'Litros','Litros',1,NULL,NULL);
/*!40000 ALTER TABLE `unidads` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_roles`
--

DROP TABLE IF EXISTS `user_roles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_roles` (
  `user_id` bigint(20) unsigned NOT NULL,
  `role_id` bigint(20) unsigned NOT NULL,
  PRIMARY KEY (`user_id`,`role_id`),
  KEY `user_roles_role_id_foreign` (`role_id`),
  CONSTRAINT `user_roles_role_id_foreign` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE CASCADE,
  CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_roles`
--

LOCK TABLES `user_roles` WRITE;
/*!40000 ALTER TABLE `user_roles` DISABLE KEYS */;
INSERT INTO `user_roles` VALUES (1,1),(2,2),(5,3),(6,2);
/*!40000 ALTER TABLE `user_roles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `users_email_unique` (`email`),
  KEY `users_empresa_id_foreign` (`empresa_id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (1,'Admin','admin@admin.com',NULL,'$2y$12$kXT4glz/JrN5Lbl0S7JWbuX2nKWNNOKVx8Ch7pTLEMDGvwmlEuwEa',1,NULL,'2025-03-03 16:37:54','2025-12-24 23:50:37'),(2,'Carla Almiron','carla@gmail.com',NULL,'$2y$12$CFBJpUEBt0G94/ozClDdX.ei6UgTKRrzYDTGj4kNxhy2vopuqzF8u',1,NULL,'2025-04-10 14:20:22','2025-04-10 14:20:22'),(3,'Federico Molinari','federico@gmail.com',NULL,'$2y$12$VyI9s2wS56tk5ZBlJ7sl0OtD4UV8ZMwc7WW6MDiuSe42LD8Bco/B6',1,NULL,'2025-04-10 15:31:45','2025-04-10 15:31:45'),(4,'Pedro Artazar','pedroartazar@gmail.com',NULL,'$2b$10$44oLCa7Z6IUhcZUBmgKrD.7tq/XjnAhp/Uuy3QbgGK/KzmM/d0tM2',1,NULL,NULL,NULL),(5,'Diego Varela','diegovarela@gmail.com',NULL,'$2b$10$0KBPv5qX6IXZPFQxDW/jfeM.n0D8XbosC7GfaDeko0icHnkzFsHdi',1,NULL,NULL,NULL),(6,'Walter Trinidad','walter@gmail.com',NULL,'$2b$10$/51VqPJssyiJTOhCf.1bDOwhdFMLY37IJQlk/OfhmcoSoo9/iH7Cy',1,NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `ventas`
--

DROP TABLE IF EXISTS `ventas`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `ventas` (
  `id` bigint(20) unsigned NOT NULL AUTO_INCREMENT,
  `fecha` date NOT NULL,
  `precio_total` decimal(8,2) NOT NULL,
  `puntos_ganados` int(11) DEFAULT 0,
  `puntos_canjeados` int(11) DEFAULT 0,
  `descuento_porcentaje` decimal(5,2) DEFAULT 0.00,
  `descuento_monto` decimal(8,2) DEFAULT 0.00,
  `efectivo` decimal(8,2) DEFAULT 0.00,
  `tarjeta` decimal(8,2) DEFAULT 0.00,
  `mercadopago` decimal(8,2) DEFAULT 0.00,
  `transferencia` decimal(10,2) NOT NULL DEFAULT 0.00,
  `empresa_id` bigint(20) unsigned NOT NULL,
  `caja_id` int(11) DEFAULT 1,
  `usuario_id` bigint(20) unsigned DEFAULT NULL,
  `cliente_id` bigint(20) unsigned DEFAULT NULL,
  `arqueo_id` bigint(20) unsigned DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `es_cuenta_corriente` tinyint(1) NOT NULL DEFAULT 0,
  `duracion_segundos` int(11) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `ventas_cliente_id_foreign` (`cliente_id`),
  KEY `ventas_usuario_id_foreign` (`usuario_id`),
  KEY `fk_ventas_arqueos` (`arqueo_id`),
  CONSTRAINT `fk_ventas_arqueos` FOREIGN KEY (`arqueo_id`) REFERENCES `arqueos` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=162 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `ventas`
--

LOCK TABLES `ventas` WRITE;
/*!40000 ALTER TABLE `ventas` DISABLE KEYS */;
INSERT INTO `ventas` VALUES (1,'2026-01-01',9700.00,0,0,0.00,0.00,0.00,0.00,9700.00,0.00,1,1,1,1,1,'2026-01-11 16:54:08','2026-01-11 16:54:08',0,0),(2,'2026-01-02',17000.00,0,0,0.00,0.00,20000.00,0.00,0.00,0.00,1,1,1,1,2,'2026-01-11 17:47:02','2026-01-11 17:47:02',0,0),(3,'2026-01-03',7000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,2,1,3,'2026-01-11 18:18:06','2026-01-11 18:18:06',0,45),(4,'2026-01-04',6000.00,0,0,0.00,0.00,6000.00,0.00,0.00,0.00,1,1,1,1,4,'2026-01-11 18:38:13','2026-01-11 18:38:13',0,0),(5,'2026-01-05',13700.00,0,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,2,3,5,'2026-01-11 18:55:30','2026-01-11 18:55:30',1,50),(6,'2026-01-05',6500.00,0,0,0.00,0.00,6500.00,0.00,0.00,0.00,1,1,2,1,5,'2026-01-11 19:03:43','2026-01-11 19:03:43',0,46),(7,'2026-01-05',5000.00,0,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,1,2,1,5,'2026-01-11 19:05:26','2026-01-11 19:05:26',0,45),(8,'2026-01-06',15200.00,0,0,0.00,0.00,0.00,0.00,15200.00,0.00,1,1,1,1,6,'2026-01-11 19:17:09','2026-01-11 19:17:09',0,0),(9,'2026-01-06',5000.00,0,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,1,1,1,6,'2026-01-11 19:32:43','2026-01-11 19:32:43',0,0),(10,'2026-01-07',8810.00,0,0,0.00,0.00,0.00,0.00,8810.00,0.00,1,1,1,1,7,'2026-01-11 19:36:03','2026-01-11 19:36:03',0,0),(11,'2026-01-07',9150.00,0,0,0.00,0.00,0.00,0.00,9150.00,0.00,1,1,1,1,7,'2026-01-11 19:37:14','2026-01-11 19:37:14',0,0),(12,'2026-01-08',3000.00,0,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,1,1,1,8,'2026-01-11 19:41:34','2026-01-11 19:41:34',0,0),(13,'2026-01-08',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,8,'2026-01-11 19:44:29','2026-01-11 19:44:29',0,0),(14,'2026-01-08',7200.00,0,0,0.00,0.00,0.00,0.00,7200.00,0.00,1,1,1,1,8,'2026-01-11 19:46:08','2026-01-11 19:46:08',0,0),(15,'2026-01-08',5800.00,0,0,0.00,0.00,0.00,0.00,5800.00,0.00,1,1,1,1,8,'2026-01-11 19:51:54','2026-01-11 19:51:54',0,0),(16,'2026-01-08',5800.00,0,0,0.00,0.00,0.00,0.00,5800.00,0.00,1,1,1,1,8,'2026-01-11 19:56:55','2026-01-11 19:56:55',0,0),(17,'2026-01-09',22910.00,0,0,0.00,0.00,0.00,22910.00,0.00,0.00,1,1,1,1,9,'2026-01-11 20:14:21','2026-01-11 20:14:21',0,0),(18,'2026-01-10',8965.50,0,0,0.00,0.00,0.00,0.00,8965.50,0.00,1,1,1,1,10,'2026-01-11 20:22:08','2026-01-11 20:22:08',0,0),(19,'2026-01-10',11300.00,0,0,0.00,0.00,0.00,11300.00,0.00,0.00,1,1,1,1,10,'2026-01-11 20:24:03','2026-01-11 20:24:03',0,0),(20,'2026-01-11',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,11,'2026-01-11 20:30:05','2026-01-11 20:30:05',0,0),(21,'2026-01-11',20200.00,0,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,5,11,'2026-01-11 20:31:04','2026-01-11 20:31:04',1,0),(22,'2026-01-12',3100.00,0,0,0.00,0.00,3100.00,0.00,0.00,0.00,1,1,1,1,12,'2026-01-12 15:19:14','2026-01-12 15:19:14',0,0),(23,'2026-01-12',10500.00,0,0,0.00,0.00,10500.00,0.00,0.00,0.00,1,1,1,1,12,'2026-01-12 15:55:32','2026-01-12 15:55:32',0,0),(24,'2026-01-12',13000.00,0,0,0.00,0.00,0.00,0.00,13000.00,0.00,1,1,1,1,12,'2026-01-12 16:23:23','2026-01-12 16:23:23',0,0),(25,'2026-01-12',12000.00,0,0,0.00,0.00,12000.00,0.00,0.00,0.00,1,1,1,1,12,'2026-01-12 16:25:43','2026-01-12 16:25:43',0,0),(26,'2026-01-12',7000.00,0,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,2,2,1,14,'2026-01-12 19:09:00','2026-01-12 19:09:00',0,40),(27,'2026-01-12',6500.00,0,0,0.00,0.00,6500.00,0.00,0.00,0.00,1,1,1,1,15,'2026-01-12 20:24:15','2026-01-12 20:24:15',0,0),(28,'2026-01-12',7100.00,71,0,0.00,0.00,7100.00,0.00,0.00,0.00,1,1,1,3,15,'2026-01-12 20:27:20','2026-01-12 20:27:20',0,0),(29,'2026-01-12',7000.00,70,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,1,1,5,15,'2026-01-13 00:04:36','2026-01-13 00:04:36',0,0),(30,'2026-01-12',1830.00,18,1170,0.00,1170.00,0.00,0.00,1830.00,0.00,1,1,1,5,15,'2026-01-13 00:06:56','2026-01-13 00:06:56',0,0),(31,'2026-01-12',7200.00,0,0,0.00,0.00,7200.00,0.00,0.00,0.00,1,1,1,1,15,'2026-01-13 01:38:46','2026-01-13 01:38:46',0,0),(32,'2026-01-13',8000.00,0,0,0.00,0.00,8000.00,0.00,0.00,0.00,1,1,1,1,16,'2026-01-13 18:12:23','2026-01-13 18:12:23',0,0),(33,'2026-01-13',7000.00,0,0,0.00,0.00,0.00,0.00,7000.00,0.00,1,1,1,1,16,'2026-01-13 18:15:32','2026-01-13 18:15:32',0,0),(34,'2026-01-13',9300.00,0,0,0.00,0.00,0.00,0.00,9300.00,0.00,1,1,1,1,16,'2026-01-13 21:10:16','2026-01-13 21:10:16',0,0),(35,'2026-01-13',7000.00,0,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,1,1,1,16,'2026-01-13 21:11:40','2026-01-13 21:11:40',0,0),(36,'2026-01-13',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,17,'2026-01-13 22:13:33','2026-01-13 22:13:33',0,0),(37,'2026-01-13',4500.00,0,0,0.00,0.00,0.00,0.00,4500.00,0.00,1,1,1,1,17,'2026-01-13 23:40:24','2026-01-13 23:40:24',0,0),(38,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,18,'2026-01-14 14:22:10','2026-01-14 14:22:10',0,0),(39,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,19,'2026-01-14 14:37:46','2026-01-14 14:37:46',0,0),(40,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,20,'2026-01-14 14:53:34','2026-01-14 14:53:34',0,0),(41,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,21,'2026-01-14 15:12:16','2026-01-14 15:12:16',0,0),(42,'2026-01-14',8900.00,0,0,0.00,0.00,0.00,0.00,8900.00,0.00,1,1,1,1,22,'2026-01-14 16:08:17','2026-01-14 16:08:17',0,0),(43,'2026-01-14',9000.00,0,0,0.00,0.00,9000.00,0.00,0.00,0.00,1,1,1,1,23,'2026-01-14 16:19:26','2026-01-14 16:19:26',0,0),(44,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,24,'2026-01-14 16:25:10','2026-01-14 16:25:10',0,0),(45,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,25,'2026-01-14 16:45:47','2026-01-14 16:45:47',0,0),(46,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,26,'2026-01-14 16:56:25','2026-01-14 16:56:25',0,0),(47,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,27,'2026-01-14 17:06:01','2026-01-14 17:06:01',0,0),(48,'2026-01-14',6000.00,0,0,0.00,0.00,6000.00,0.00,0.00,0.00,1,1,1,1,28,'2026-01-14 17:12:07','2026-01-14 17:12:07',0,0),(49,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,29,'2026-01-14 17:17:36','2026-01-14 17:17:36',0,0),(50,'2026-01-14',3000.00,0,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,1,1,1,30,'2026-01-14 17:30:09','2026-01-14 17:30:09',0,0),(51,'2026-01-14',3000.00,0,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,1,1,1,30,'2026-01-14 17:31:42','2026-01-14 17:31:42',0,0),(52,'2026-01-14',3000.00,0,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,1,1,1,30,'2026-01-14 17:39:40','2026-01-14 17:39:40',0,0),(53,'2026-01-14',7000.00,0,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,1,1,1,31,'2026-01-14 18:13:09','2026-01-14 18:13:09',0,0),(54,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,32,'2026-01-14 18:23:04','2026-01-14 18:23:04',0,0),(55,'2026-01-14',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,33,'2026-01-14 18:29:32','2026-01-14 18:29:32',0,0),(56,'2026-01-14',7000.00,70,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,1,1,5,34,'2026-01-14 19:37:46','2026-01-14 19:37:46',0,0),(57,'2026-01-14',7000.00,70,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,1,1,5,34,'2026-01-14 19:40:03','2026-01-14 19:40:03',0,0),(58,'2026-01-14',7000.00,70,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,1,1,3,34,'2026-01-14 19:45:53','2026-01-14 19:45:53',0,0),(59,'2026-01-14',6000.00,60,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,1,1,3,34,'2026-01-14 19:49:39','2026-01-14 19:49:39',0,0),(60,'2026-01-14',3500.00,35,0,0.00,0.00,500.00,0.00,0.00,0.00,1,1,1,3,34,'2026-01-14 19:53:16','2026-01-14 19:53:16',0,0),(61,'2026-01-14',3000.00,30,0,0.00,0.00,1000.00,0.00,0.00,0.00,1,1,1,5,34,'2026-01-14 19:59:49','2026-01-14 19:59:49',0,0),(62,'2026-01-14',3000.00,30,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,5,34,'2026-01-14 20:52:31','2026-01-14 20:52:31',0,0),(63,'2026-01-15',5800.00,58,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,5,35,'2026-01-15 14:09:22','2026-01-15 14:09:22',0,0),(64,'2026-01-15',14000.00,0,0,0.00,0.00,14000.00,0.00,0.00,0.00,1,1,1,1,35,'2026-01-15 14:50:39','2026-01-15 14:50:39',0,0),(65,'2026-01-15',9300.00,0,0,0.00,0.00,0.00,0.00,9300.00,0.00,1,1,1,1,35,'2026-01-15 15:03:22','2026-01-15 15:03:22',0,0),(66,'2026-01-15',4100.00,0,0,0.00,0.00,0.00,0.00,4100.00,0.00,1,1,1,1,35,'2026-01-15 15:05:56','2026-01-15 15:05:56',0,0),(67,'2026-01-15',7300.00,0,0,0.00,0.00,0.00,0.00,7300.00,0.00,1,1,1,1,35,'2026-01-15 15:36:46','2026-01-15 15:36:46',0,0),(68,'2026-01-15',5800.00,0,0,0.00,0.00,0.00,0.00,5800.00,0.00,1,1,1,1,35,'2026-01-15 15:46:02','2026-01-15 15:46:02',0,0),(69,'2026-01-15',9300.00,0,0,0.00,0.00,0.00,0.00,9300.00,0.00,1,1,1,1,35,'2026-01-15 15:52:36','2026-01-15 15:52:36',0,0),(70,'2026-01-15',5100.00,0,0,0.00,0.00,0.00,0.00,5100.00,0.00,1,1,1,1,35,'2026-01-15 15:55:51','2026-01-15 15:55:51',0,0),(71,'2026-01-16',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,36,'2026-01-16 18:02:41','2026-01-16 18:02:41',0,0),(72,'2026-01-16',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,36,'2026-01-16 18:07:16','2026-01-16 18:07:16',0,0),(73,'2026-01-16',14100.00,0,0,0.00,0.00,0.00,0.00,14100.00,0.00,1,1,1,1,36,'2026-01-16 18:25:44','2026-01-16 18:25:44',0,0),(74,'2026-01-16',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,36,'2026-01-16 18:31:58','2026-01-16 18:31:58',0,0),(75,'2026-01-16',5200.00,52,0,0.00,0.00,2000.00,0.00,0.00,0.00,1,1,1,5,36,'2026-01-16 19:47:29','2026-01-16 19:47:29',0,0),(76,'2026-01-16',7100.00,71,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,6,36,'2026-01-16 23:09:35','2026-01-16 23:09:35',1,0),(77,'2026-01-16',5700.00,57,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,4,36,'2026-01-16 23:10:47','2026-01-16 23:10:47',1,0),(78,'2026-01-16',8700.00,87,0,0.00,0.00,0.00,0.00,0.00,0.00,1,1,1,2,36,'2026-01-16 23:21:22','2026-01-16 23:21:22',1,0),(79,'2026-01-16',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,36,'2026-01-17 01:25:44','2026-01-17 01:25:44',0,0),(80,'2026-01-16',6000.00,0,0,0.00,0.00,0.00,0.00,6000.00,0.00,1,1,1,1,36,'2026-01-17 01:44:48','2026-01-17 01:44:48',0,0),(81,'2026-01-16',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,37,'2026-01-17 02:04:28','2026-01-17 02:04:28',0,0),(82,'2026-01-16',10000.00,0,0,0.00,0.00,0.00,0.00,10000.00,0.00,1,1,1,1,37,'2026-01-17 02:05:49','2026-01-17 02:05:49',0,0),(83,'2026-01-16',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,38,'2026-01-17 02:16:48','2026-01-17 02:16:48',0,0),(84,'2026-01-16',10000.00,0,0,0.00,0.00,0.00,0.00,10000.00,0.00,1,1,1,1,38,'2026-01-17 02:17:32','2026-01-17 02:17:32',0,0),(85,'2026-01-17',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,1,1,1,39,'2026-01-17 06:35:02','2026-01-17 06:35:02',0,25),(86,'2026-01-17',12800.00,128,0,0.00,0.00,7800.00,0.00,0.00,0.00,1,2,2,2,40,'2026-01-17 15:07:56','2026-01-17 15:07:56',0,70),(87,'2026-01-17',5000.00,0,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,2,2,1,40,'2026-01-17 15:32:19','2026-01-17 15:32:19',0,83),(88,'2026-01-17',6900.00,0,0,0.00,0.00,0.00,0.00,6900.00,0.00,1,2,2,1,40,'2026-01-17 16:34:40','2026-01-17 16:34:40',0,37),(89,'2026-01-17',5700.00,0,0,0.00,0.00,0.00,0.00,5700.00,0.00,1,2,2,1,40,'2026-01-17 17:16:40','2026-01-17 17:16:40',0,72),(90,'2026-01-17',5100.00,0,0,0.00,0.00,5100.00,0.00,0.00,0.00,1,2,1,1,41,'2026-01-17 17:47:57','2026-01-17 17:47:57',0,35),(91,'2026-01-17',5700.00,0,0,0.00,0.00,5700.00,0.00,0.00,0.00,1,2,1,1,41,'2026-01-17 17:48:39','2026-01-17 17:48:39',0,19),(92,'2026-01-17',5700.00,0,0,0.00,0.00,0.00,0.00,5700.00,0.00,1,2,1,1,41,'2026-01-17 17:49:18','2026-01-17 17:49:18',0,22),(93,'2026-01-17',7600.00,0,0,0.00,0.00,0.00,0.00,7600.00,0.00,1,2,2,1,42,'2026-01-17 17:59:13','2026-01-17 17:59:13',0,18),(94,'2026-01-17',4000.00,0,0,0.00,0.00,4000.00,0.00,0.00,0.00,1,2,2,1,42,'2026-01-17 18:00:02','2026-01-17 18:00:02',0,36),(95,'2026-01-17',5700.00,0,0,0.00,0.00,5700.00,0.00,0.00,0.00,1,2,2,1,42,'2026-01-17 18:47:17','2026-01-17 18:47:17',0,24),(96,'2026-01-17',5700.00,0,0,0.00,0.00,0.00,0.00,5700.00,0.00,1,2,2,1,42,'2026-01-17 18:48:34','2026-01-17 18:48:34',0,13),(97,'2026-01-17',7600.00,0,0,0.00,0.00,0.00,0.00,7600.00,0.00,1,2,2,1,42,'2026-01-17 18:49:37','2026-01-17 18:49:37',0,26),(98,'2026-01-17',5700.00,0,0,0.00,0.00,5700.00,0.00,0.00,0.00,1,2,2,1,42,'2026-01-17 20:37:41','2026-01-17 20:37:41',0,29),(99,'2026-01-17',9100.00,0,0,0.00,0.00,0.00,9100.00,0.00,0.00,1,2,2,1,42,'2026-01-17 20:40:31','2026-01-17 20:40:31',0,53),(100,'2026-01-17',14900.00,0,0,0.00,0.00,0.00,0.00,0.00,14900.00,1,2,2,1,42,'2026-01-17 20:43:05','2026-01-17 20:43:05',0,67),(101,'2026-01-17',10900.00,109,0,0.00,0.00,0.00,0.00,0.00,0.00,1,2,2,4,42,'2026-01-17 20:45:38','2026-01-17 20:45:38',1,88),(102,'2026-01-17',5700.00,57,0,0.00,0.00,0.00,0.00,0.00,0.00,1,2,2,6,42,'2026-01-17 20:48:57','2026-01-17 20:48:57',1,164),(103,'2026-01-17',8000.00,0,0,0.00,0.00,8000.00,0.00,0.00,0.00,1,2,2,1,42,'2026-01-17 22:16:38','2026-01-17 22:16:38',0,46),(104,'2026-01-17',26000.00,0,0,0.00,0.00,26000.00,0.00,0.00,0.00,1,2,2,1,42,'2026-01-17 22:21:05','2026-01-17 22:21:05',0,74),(105,'2026-01-18',14100.00,0,0,0.00,0.00,0.00,0.00,14100.00,0.00,1,2,2,1,44,'2026-01-18 13:01:56','2026-01-18 13:01:56',0,112),(106,'2026-01-18',12900.00,0,0,0.00,0.00,12900.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 13:04:47','2026-01-18 13:04:47',0,107),(107,'2026-01-18',4600.00,0,0,0.00,0.00,0.00,0.00,4600.00,0.00,1,2,2,1,44,'2026-01-18 13:57:14','2026-01-18 13:57:14',0,89),(108,'2026-01-18',5800.00,0,0,0.00,0.00,0.00,0.00,5800.00,0.00,1,2,2,1,44,'2026-01-18 14:12:10','2026-01-18 14:12:10',0,11),(109,'2026-01-18',8000.00,0,0,0.00,0.00,8000.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 15:30:34','2026-01-18 15:30:34',0,31),(110,'2026-01-18',6800.00,0,0,0.00,0.00,6800.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 15:39:59','2026-01-18 15:39:59',0,61),(111,'2026-01-18',6500.00,0,0,0.00,0.00,6500.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 17:33:59','2026-01-18 17:33:59',0,27),(112,'2026-01-18',10900.00,0,0,0.00,0.00,10900.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 17:36:57','2026-01-18 17:36:57',0,30),(113,'2026-01-18',7900.00,0,0,0.00,0.00,7900.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 17:38:26','2026-01-18 17:38:26',0,26),(114,'2026-01-18',10500.00,0,0,0.00,0.00,10500.00,0.00,0.00,0.00,1,2,2,1,44,'2026-01-18 17:39:44','2026-01-18 17:39:44',0,23),(115,'2026-01-18',9100.00,0,0,0.00,0.00,9100.00,0.00,0.00,0.00,1,2,6,1,45,'2026-01-18 18:12:42','2026-01-18 18:12:42',0,30),(116,'2026-01-18',4700.00,0,0,0.00,0.00,4700.00,0.00,0.00,0.00,1,2,6,1,45,'2026-01-18 18:22:16','2026-01-18 18:22:16',0,27),(117,'2026-01-18',7000.00,0,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,2,6,1,45,'2026-01-18 18:28:35','2026-01-18 18:28:35',0,20),(118,'2026-01-18',6800.00,0,0,0.00,0.00,0.00,0.00,6800.00,0.00,1,2,6,1,45,'2026-01-18 18:33:57','2026-01-18 18:33:57',0,46),(119,'2026-01-18',4900.00,0,0,0.00,0.00,0.00,4900.00,0.00,0.00,1,2,6,1,45,'2026-01-18 19:38:40','2026-01-18 19:38:40',0,32),(120,'2026-01-18',7600.00,0,0,0.00,0.00,7600.00,0.00,0.00,0.00,1,1,6,1,46,'2026-01-18 21:10:19','2026-01-18 21:10:19',0,46),(121,'2026-01-18',6100.00,0,0,0.00,0.00,0.00,6100.00,0.00,0.00,1,1,6,1,46,'2026-01-18 21:11:59','2026-01-18 21:11:59',0,47),(122,'2026-01-18',8000.00,0,0,0.00,0.00,0.00,0.00,8000.00,0.00,1,1,6,1,46,'2026-01-18 21:12:39','2026-01-18 21:12:39',0,23),(123,'2026-01-18',4300.00,0,0,0.00,0.00,0.00,0.00,0.00,4300.00,1,1,6,1,46,'2026-01-18 21:13:23','2026-01-18 21:13:23',0,29),(124,'2026-01-18',9000.00,0,0,0.00,0.00,9000.00,0.00,0.00,0.00,1,2,2,1,47,'2026-01-18 22:19:21','2026-01-18 22:19:21',0,49),(125,'2026-01-18',4800.00,0,0,0.00,0.00,4800.00,0.00,0.00,0.00,1,2,2,1,47,'2026-01-18 22:20:37','2026-01-18 22:20:37',0,46),(126,'2026-01-18',9100.00,0,0,0.00,0.00,0.00,0.00,9100.00,0.00,1,2,2,1,47,'2026-01-18 22:25:23','2026-01-18 22:25:23',0,51),(127,'2026-01-18',23500.00,0,0,0.00,0.00,0.00,23500.00,0.00,0.00,1,2,2,1,47,'2026-01-18 22:27:25','2026-01-18 22:27:25',0,92),(128,'2026-01-18',5600.00,56,0,0.00,0.00,4600.00,0.00,0.00,0.00,1,2,2,2,47,'2026-01-19 00:29:50','2026-01-19 00:29:50',0,41),(129,'2026-01-18',3000.00,30,0,0.00,0.00,2000.00,0.00,0.00,0.00,1,2,2,2,47,'2026-01-19 00:51:58','2026-01-19 00:51:58',0,716),(130,'2026-01-19',5000.00,0,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 14:14:14','2026-01-19 14:14:14',0,43),(131,'2026-01-19',5500.00,0,0,0.00,0.00,0.00,0.00,5500.00,0.00,1,2,6,1,48,'2026-01-19 14:31:58','2026-01-19 14:31:58',0,93),(132,'2026-01-19',5000.00,0,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 14:41:56','2026-01-19 14:41:56',0,14),(133,'2026-01-19',4200.00,0,0,0.00,0.00,0.00,4200.00,0.00,0.00,1,2,6,1,48,'2026-01-19 14:48:53','2026-01-19 14:48:53',0,34),(134,'2026-01-19',5000.00,0,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 15:45:30','2026-01-19 15:45:30',0,40),(135,'2026-01-19',7200.00,0,0,0.00,0.00,0.00,0.00,7200.00,0.00,1,2,6,1,48,'2026-01-19 15:47:15','2026-01-19 15:47:15',0,44),(136,'2026-01-19',10800.00,0,0,0.00,0.00,0.00,0.00,10800.00,0.00,1,2,6,1,48,'2026-01-19 15:49:57','2026-01-19 15:49:57',0,70),(137,'2026-01-19',11700.00,0,0,0.00,0.00,0.00,11700.00,0.00,0.00,1,2,6,1,48,'2026-01-19 16:44:57','2026-01-19 16:44:57',0,45),(138,'2026-01-19',8500.00,85,0,0.00,0.00,8500.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 16:50:21','2026-01-19 16:50:21',0,122),(139,'2026-01-19',8500.00,85,0,0.00,0.00,8500.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 17:24:07','2026-01-19 17:24:07',0,50),(140,'2026-01-19',3000.00,30,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 17:39:47','2026-01-19 17:39:47',0,43),(141,'2026-01-19',5000.00,50,0,0.00,0.00,5000.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 17:46:35','2026-01-19 17:46:35',0,70),(142,'2026-01-19',6000.00,60,0,0.00,0.00,6000.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 18:02:05','2026-01-19 18:02:05',0,64),(143,'2026-01-19',6000.00,60,0,0.00,0.00,6000.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 18:08:50','2026-01-19 18:08:50',0,35),(144,'2026-01-19',7000.00,70,0,0.00,0.00,6000.00,0.00,0.00,0.00,1,2,6,2,48,'2026-01-19 18:13:41','2026-01-19 18:13:41',0,182),(145,'2026-01-19',7000.00,70,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,2,6,6,48,'2026-01-19 18:24:17','2026-01-19 18:24:17',0,55),(146,'2026-01-19',3000.00,30,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,2,6,5,48,'2026-01-19 18:28:26','2026-01-19 18:28:26',0,27),(147,'2026-01-19',3000.00,30,0,0.00,0.00,3000.00,0.00,0.00,0.00,1,2,6,6,48,'2026-01-19 18:30:39','2026-01-19 18:30:39',0,23),(148,'2026-01-19',3000.00,0,0,0.00,0.00,0.00,0.00,3000.00,0.00,1,2,6,1,48,'2026-01-19 18:51:27','2026-01-19 18:51:27',0,610),(149,'2026-01-19',12600.00,0,0,0.00,0.00,0.00,0.00,12600.00,0.00,1,2,6,1,48,'2026-01-19 19:41:41','2026-01-19 19:41:41',0,50),(150,'2026-01-19',4000.00,40,0,0.00,0.00,4000.00,0.00,0.00,0.00,1,2,6,5,48,'2026-01-19 19:46:47','2026-01-19 19:46:47',0,43),(151,'2026-01-19',7000.00,70,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,2,6,5,48,'2026-01-19 19:47:52','2026-01-19 19:47:52',0,24),(152,'2026-01-19',7000.00,70,0,0.00,0.00,0.00,0.00,7000.00,0.00,1,2,6,5,48,'2026-01-19 19:58:22','2026-01-19 19:58:22',0,249),(153,'2026-01-19',11000.00,0,0,0.00,0.00,11000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 20:38:03','2026-01-19 20:38:03',0,52),(154,'2026-01-19',10000.00,0,0,0.00,0.00,10000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 20:39:44','2026-01-19 20:39:44',0,53),(155,'2026-01-19',13000.00,0,0,0.00,0.00,13000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 21:37:38','2026-01-19 21:37:38',0,40),(156,'2026-01-19',6700.00,0,0,0.00,0.00,0.00,0.00,6700.00,0.00,1,2,6,1,48,'2026-01-19 21:39:37','2026-01-19 21:39:37',0,41),(157,'2026-01-19',9000.00,0,0,0.00,0.00,9000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 21:40:50','2026-01-19 21:40:50',0,50),(158,'2026-01-19',7000.00,0,0,0.00,0.00,7000.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 21:43:57','2026-01-19 21:43:57',0,16),(159,'2026-01-19',20100.00,0,0,0.00,0.00,20100.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 22:10:20','2026-01-19 22:10:20',0,54),(160,'2026-01-19',10600.00,0,0,0.00,0.00,10600.00,0.00,0.00,0.00,1,2,6,1,48,'2026-01-19 22:12:53','2026-01-19 22:12:53',0,40),(161,'2026-01-19',12200.00,0,0,0.00,0.00,0.00,0.00,0.00,12200.00,1,2,6,1,48,'2026-01-19 22:14:16','2026-01-19 22:14:16',0,48);
/*!40000 ALTER TABLE `ventas` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-01-19 20:01:44
