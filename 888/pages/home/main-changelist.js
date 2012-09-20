// JavaScript Document

$(document).ready(function () {	
	$("#bestlink").click(function() {
		$("#best").show();
		$("#mapArea").attr("src","../../images/main-map.png");
		$("#list").hide();
		$("#favinfo").hide();
		return false; 
		});
	$("#listlinkN").click(function() {
		$("#list").show();
		$("#mapArea").attr("src","../../images/map-n.png");
		$("#best").hide();
		$("#favinfo").hide();
		return false; 
		});
	$("#listlinkC").click(function() {
		$("#list").show();
		$("#mapArea").attr("src","../../images/map-c.png");
		$("#best").hide();
		$("#favinfo").hide();
		return false; 
		});
	$("#listlinkE").click(function() {
		$("#list").show();
		$("#mapArea").attr("src","../../images/map-e.png");
		$("#best").hide();
		$("#favinfo").hide();
		return false; 
		});
	$("#listlinkS").click(function() {
		$("#list").show();
		$("#mapArea").attr("src","../../images/map-s.png");
		$("#best").hide();
		$("#favinfo").hide();
		return false; 
		});
	$("#listlinkI").click(function() {
		$("#list").show();
		$("#mapArea").attr("src","../../images/map-i.png");
		$("#best").hide();
		$("#favinfo").hide();
		return false; 
		});
	$("#favoritelink").click(function() {
		$("#favorite").show();
		$("#mapArea").attr("src","../../images/main-map.png");
		$("#best").hide();
		$("#favinfo").hide();
		$("#list").hide();
		return false; 
		});
	$("#favinfolink").click(function() {
		$("#favinfo").show();
		$("#mapArea").attr("src","../../images/main-map.png");
		$("#best").hide();
		$("#favorite").hide();
		$("#list").hide();
		return false; 
		});
});
